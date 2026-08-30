const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, execFileSync } = require('child_process');

const port = 4173;
const root = __dirname;

function findIcarus() {
  const candidates = [
    'C:\\iverilog\\bin\\iverilog.exe',
    'C:\\Program Files\\iverilog\\bin\\iverilog.exe',
    'C:\\Program Files\\Icarus Verilog\\bin\\iverilog.exe'
  ];
  const installed = candidates.find((candidate) => fs.existsSync(candidate));
  if (installed) return installed;
  try {
    return execFileSync(process.platform === 'win32' ? 'where.exe' : 'which', ['iverilog'], { encoding: 'utf8' }).split(/\r?\n/).find(Boolean) || null;
  } catch {
    return null;
  }
}

function findVvp(iverilog) {
  const candidate = path.join(path.dirname(iverilog), process.platform === 'win32' ? 'vvp.exe' : 'vvp');
  if (fs.existsSync(candidate)) return candidate;
  return process.platform === 'win32' ? 'vvp.exe' : 'vvp';
}

function resolveSimulationTop(code, requested) {
  const modules = [...String(code || '').replace(/\/\/.*$/gm, '').matchAll(/\bmodule\s+(?:automatic\s+|static\s+)?([A-Za-z_$][\w$]*)\b/g)].map((match) => match[1]);
  if (modules.includes(requested)) return requested;
  return modules.find((module) => /(?:^|[_$])tb(?:$|[_$])/i.test(module) || /testbench/i.test(module)) || requested;
}

function run(command, args, cwd) {
  return new Promise((resolve) => execFile(command, args, { cwd, windowsHide: true, timeout: 120000 }, (error, stdout, stderr) => resolve({ error, stdout: stdout || '', stderr: stderr || '' })));
}

function parseVcd(text) {
  const ids = {};
  const changes = {};
  const events = [];
  let inHeader = true;
  let time = 0;
  text.split(/\r?\n/).forEach((line) => {
    const value = line.trim();
    if (!value) return;
    if (inHeader) {
      const match = value.match(/^\$var\s+\S+\s+(\d+)\s+(\S+)\s+(.+?)\s+\$end$/);
      if (match) {
        const width = Number(match[1]);
        const fullName = match[3].replace(/\s+\[.*$/, '').trim();
        if (!fullName) return;
        ids[match[2]] = { width, name: fullName, leaf: fullName.split('.').pop() || fullName };
        changes[match[2]] = [];
      }
      if (value === '$enddefinitions $end') inHeader = false;
      return;
    }
    if (value[0] === '#') { time = Number(value.slice(1)); return; }
    const vector = value.match(/^b([01xz]+)\s+(\S+)/i);
    const scalar = value.match(/^([01xz])(\S+)$/i);
    const id = vector ? vector[2] : scalar && scalar[2];
    const signalValue = vector ? vector[1] : scalar && scalar[1];
    if (id && ids[id] && changes[id]) {
      const signal = ids[id];
      const signalName = String(signal.name || signal.leaf || id);
      const event = { id, time, name: signalName, leaf: String(signal.leaf || signalName).split('.').pop(), value: signalValue, depth: signalName.split('.').length };
      changes[id].push({ time, value: signalValue });
      events.push(event);
    }
  });

  const selected = {};
  Object.keys(changes).forEach((id) => {
    const signal = ids[id];
    if (!signal || !signal.leaf) return;
    const current = selected[signal.leaf];
    const signalName = String(signal.name || signal.leaf || id);
    if (!current || signalName.split('.').length < String(current.signal.name || current.signal.leaf || '').split('.').length) selected[signal.leaf] = { id, signal: { ...signal, name: signalName } };
  });
  const selectedIds = new Set(Object.values(selected).map((item) => item.id));
  const signals = Object.values(selected).map(({ id, signal }) => ({ name: signal.name, leaf: signal.leaf, changes: changes[id] }));
  const names = Object.keys(selected);
  const snapshots = [];
  const current = {};
  [...new Set(events.map((event) => event.time))].sort((a, b) => a - b).forEach((eventTime) => {
    events.filter((event) => event.time === eventTime && selectedIds.has(event.id)).sort((a, b) => b.depth - a.depth).forEach((event) => {
      if (current[event.leaf] === undefined || event.depth <= current[event.leaf].depth) current[event.leaf] = { value: event.value, depth: event.depth };
    });
    if (events.some((event) => event.time === eventTime && selectedIds.has(event.id) && ['X', 'en'].includes(event.leaf))) {
      snapshots.push({ time: eventTime, values: Object.fromEntries(names.map((name) => [name, current[name]?.value ?? 'x'])) });
    }
  });
  return { signals, snapshots };
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > 8 * 1024 * 1024) reject(new Error('请求内容超过 8 MB 限制')); });
    req.on('end', () => { try { resolve(JSON.parse(data)); } catch (error) { reject(error); } });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  if (req.method === 'POST' && req.url === '/api/simulate') {
    try {
      const body = await readBody(req);
      const iverilog = findIcarus();
      if (!iverilog) return json(res, 422, { success: false, error: '找不到 iverilog。已检查 C:\\iverilog\\bin、Program Files 和系统 PATH。' });
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verilab-'));
      const simTop = resolveSimulationTop(body.testbench, body.simTop || 'counter_tb');
      let testbench = String(body.testbench || '').replace(/\$stop\s*;/g, '$finish;');
      if (!/\$dumpfile\s*\(/.test(testbench)) {
        const dumpBlock = `\ninitial begin\n  $dumpfile("wave.vcd");\n  $dumpvars(0, ${simTop});\nend\n`;
        const end = testbench.lastIndexOf('endmodule');
        testbench = end >= 0 ? `${testbench.slice(0, end)}${dumpBlock}${testbench.slice(end)}` : `${testbench}\n${dumpBlock}`;
      }
      fs.writeFileSync(path.join(dir, 'design.v'), body.design || '', 'utf8');
      fs.writeFileSync(path.join(dir, 'testbench.v'), testbench, 'utf8');
      const compile = await run(iverilog, ['-g2012', '-o', 'sim.out', '-s', simTop, 'design.v', 'testbench.v'], dir);
      if (compile.error) return json(res, 422, { success: false, error: `iverilog 编译失败：${compile.stderr || compile.error.message}`, log: compile.stderr || compile.error.message });
      const sim = await run(findVvp(iverilog), ['sim.out'], dir);
      const log = `${compile.stdout}${compile.stderr}${sim.stdout}${sim.stderr}${sim.error ? `\n[VeriLab] vvp 执行失败：${sim.error.message}` : ''}`;
      const vcdPath = path.join(dir, 'wave.vcd');
      const parsed = fs.existsSync(vcdPath) ? parseVcd(fs.readFileSync(vcdPath, 'utf8')) : { signals: [], snapshots: [] };
      const tests = parsed.snapshots.map((snapshot) => ({
        time: `${snapshot.time} ns`,
        values: snapshot.values,
        message: Object.entries(snapshot.values).map(([name, value]) => `${name}=${value}`).join(' · '),
        pass: true
      }));
      return json(res, sim.error ? 422 : 200, { success: !sim.error, log: log + (!parsed.signals.length ? '\n[VeriLab] 未检测到 VCD 波形。' : ''), tests, signals: parsed.signals, designTop: body.designTop, simTop, duration: body.duration });
    } catch (error) {
      console.error('[VeriLab] simulation error:', error.stack || error.message);
      return json(res, 500, { success: false, error: `服务端异常：${error.message}`, details: error.stack || '' });
    }
  }
  let file = req.url === '/' || !path.extname(req.url) ? '/index.html' : req.url;
  file = path.join(root, file);
  if (!file.startsWith(root) || !fs.existsSync(file)) return json(res, 404, { error: 'Not found' });
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, () => console.log(`VeriLab running at http://localhost:${port}`));
