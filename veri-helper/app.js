const examples = {
  design: `module counter(input wire clk, input wire rst, input wire enable, output reg [3:0] count);\n+  always @(posedge clk) begin\n+    if (rst) count <= 4'd0;\n+    else if (enable) count <= count + 1'b1;\n+  end\n+endmodule`,
  testbench: `\`timescale 1ns/1ps\n+module counter_tb;\n+  reg clk = 0, rst = 1, enable = 0;\n+  wire [3:0] count;\n+  counter dut(.clk(clk), .rst(rst), .enable(enable), .count(count));\n+  always #5 clk = ~clk;\n+  initial begin\n+    $dumpfile("wave.vcd"); $dumpvars(0, counter_tb);\n+    #12 rst = 0; enable = 1;\n+    #50 enable = 0;\n+    #10 $finish;\n+  end\n+endmodule`
};
const $ = (s) => document.querySelector(s);
const state = { result: null, radix: 'hex' };
$('#designCode').value = examples.design.replace(/\n\+/g, '\n'); $('#testbenchCode').value = examples.testbench.replace(/\n\+/g, '\n');
function inferTop(code, fallback) { const source = String(code || '').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''); const modules = [...source.matchAll(/\bmodule\s+(?:automatic\s+|static\s+)?([A-Za-z_$][\w$]*)\b/g)].map((match) => match[1]); if (!modules.length) return fallback; const tb = modules.find((module) => /(?:^|[_$])tb(?:$|[_$])/i.test(module) || /testbench/i.test(module)); if (tb) return tb; const instantiated = new Set(); modules.forEach((module) => { const body = source.slice(source.indexOf(`module ${module}`)); modules.filter((candidate) => candidate !== module).forEach((candidate) => { if (new RegExp(`\\b${candidate}\\s*(?:#\\s*\\([^;]*\\)\\s*)?\\w+\\s*\\(`).test(body)) instantiated.add(candidate); }); }); return modules.find((module) => !instantiated.has(module)) || modules[0]; }
function syncTopNames() { const design = inferTop($('#designCode').value, 'counter'); const testbench = inferTop($('#testbenchCode').value, 'counter_tb'); if (!$('#designTop').dataset.edited) $('#designTop').value = design; if (!$('#simTop').dataset.edited) $('#simTop').value = testbench; }
$('#designTop').addEventListener('input', () => { $('#designTop').dataset.edited = 'true'; updateMarkdown(); });
$('#simTop').addEventListener('input', () => { $('#simTop').dataset.edited = 'true'; updateMarkdown(); });
document.querySelectorAll('[data-load]').forEach((button) => button.addEventListener('click', () => { const target = button.dataset.load === 'design' ? '#designCode' : '#testbenchCode'; $(target).value = examples[button.dataset.load].replace(/\n\+/g, '\n'); $(button.dataset.load === 'design' ? '#designTop' : '#simTop').dataset.edited = ''; syncTopNames(); showToast('示例代码已载入'); }));
function toast(text) { const el = $('#toast'); el.textContent = text; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2400); }
function esc(text) { return String(text ?? '').replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>'); }
function formatValue(value, radix = state.radix) {
  const raw = String(value ?? 'x').toLowerCase();
  if (!/^[01]+$/.test(raw) || raw.length <= 1) return raw;
  if (radix === 'hex') return parseInt(raw, 2).toString(16).toUpperCase();
  if (radix === 'dec') return String(parseInt(raw, 2));
  return raw;
}
function waveSvg(signals) {
  const width = 920; const left = 120; const right = 20; const top = 28; const rowHeight = 38;
  const max = Math.max(...signals.flatMap((signal) => signal.changes.map((change) => change.time)), 1);
  const height = top + signals.length * rowHeight + 30; const x = (time) => left + (time / max) * (width - left - right);
  const parts = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fbfcf8"/><style>text{font-family:monospace;font-size:11px;fill:#286c5e}.grid{stroke:#dce8e0;stroke-width:1}.high{stroke:#df8c4c;fill:#f8e3ca}.low{stroke:#5c9e91;fill:#dcefe7}.axis{fill:#789087}</style>`];
  for (let tick = 0; tick <= 10; tick += 1) { const tickX = left + ((width - left - right) * tick) / 10; parts.push(`<line class="grid" x1="${tickX}" y1="${top - 10}" x2="${tickX}" y2="${height - 20}"/><text class="axis" x="${tickX + 2}" y="${height - 6}">${Math.round((max * tick) / 10)} ns</text>`); }
  signals.forEach((signal, row) => { const y = top + row * rowHeight; parts.push(`<text x="8" y="${y + 15}">${esc(signal.leaf || signal.name)}</text>`); signal.changes.forEach((change, index) => { const next = signal.changes[index + 1]?.time ?? max; const x1 = x(change.time); const x2 = Math.max(x(next), x1 + 1); const high = !['0', 'x', 'z'].includes(String(change.value).toLowerCase()); parts.push(`<rect class="${high ? 'high' : 'low'}" x="${x1}" y="${y + 3}" width="${Math.max(1, x2 - x1)}" height="16"/><text x="${x1 + 3}" y="${y + 15}">${esc(formatValue(change.value))}</text>`); }); });
  return `${parts.join('')}</svg>`;
}
function updateMarkdown() {
  const r = state.result; let md = '# DLCO-EXP 仿真实验\n\n';
  md += '## 设计代码\n\n```verilog\n' + $('#designCode').value + '\n```\n\n';
  md += '## 激励代码\n\n```verilog\n' + $('#testbenchCode').value + '\n```\n\n';
  if (!r) md += '*请先运行仿真，生成测试结果和波形。*\n';
  else {
    md += `## 仿真结果\n\n- 仿真状态：${r.success ? '通过' : '失败'}\n- 设计顶层：\`${esc(r.designTop)}\`\n- 仿真顶层：\`${esc(r.simTop)}\`\n- 仿真时长：${esc(r.duration)}\n\n`;
    md += '### 测试用例表\n\n';
    const valueNames = Object.keys(r.tests?.find((test) => test.values)?.values || {});
    if (valueNames.length) { md += `| 序号 | 时间 | ${valueNames.join(' | ')} | 结果 |\n| --- | --- | ${valueNames.map(() => '---').join(' | ')} | --- |\n`; (r.tests || []).forEach((t, i) => { md += `| ${i + 1} | ${esc(t.time)} | ${valueNames.map((name) => esc(formatValue(t.values?.[name] ?? '-'))).join(' | ')} | ${t.pass ? 'PASS' : 'INFO'} |\n`; }); }
    else { md += '| 序号 | 时间 | 信号快照 | 结果 |\n| --- | --- | --- | --- |\n'; (r.tests || []).forEach((t, i) => { md += `| ${i + 1} | ${esc(t.time)} | ${esc(t.message)} | ${t.pass ? 'PASS' : 'INFO'} |\n`; }); }
    if (!r.tests?.length) md += '| 1 | - | 未检测到 $display 测试记录 | INFO |\n';
    md += '\n### 仿真波形\n\n';
    if (r.signals?.length) md += '波形图已解析，请将导出的 `waveform.svg` 与本 Markdown 放在同一目录。\n\n![仿真波形](waveform.svg)\n\n';
    else md += '*未生成 VCD 波形。请检查 Testbench 或仿真日志。*\n';
    md += '### 仿真日志\n\n```text\n' + (r.log || '') + '\n```\n';
  }
  $('#markdown').textContent = md; $('#stats').textContent = `${r?.tests?.length || 0} 个结果 · ${r?.signals?.length || 0} 个信号`;
}
function renderResult(r) {
  state.result = r; $('#runStatus').textContent = r.success ? '编译与仿真完成' : '编译或仿真失败'; const badge = $('#resultBadge'); badge.textContent = r.success ? '通过' : '失败'; badge.className = `badge ${r.success ? 'success' : 'fail'}`; $('#log').textContent = r.log || '无日志';
  const rows = r.tests?.length ? r.tests : [{ time: '-', message: '未检测到测试记录', pass: true }]; const valueNames = Object.keys(rows.find((test) => test.values)?.values || {}); $('#resultTable').className = 'result-table'; $('#resultTable').innerHTML = `<table><thead><tr><th>序号</th><th>时间</th>${valueNames.map((name) => `<th>${esc(name)}</th>`).join('')}<th>状态</th></tr></thead><tbody>${rows.map((t, i) => `<tr><td>${i + 1}</td><td>${t.time || '-'}</td>${valueNames.map((name) => `<td>${esc(formatValue(t.values?.[name] ?? '-'))}</td>`).join('')}<td class="${t.pass ? 'pass' : 'fail'}">${t.pass ? 'PASS' : 'INFO'}</td></tr>`).join('')}</tbody></table>`;
  const wave = $('#waveform'); if (!r.signals?.length) { wave.className = 'waveform empty'; wave.innerHTML = '<span>未检测到 VCD 信号</span>'; $('#exportPng').disabled = true; } else { wave.className = 'waveform'; wave.innerHTML = waveSvg(r.signals); $('#exportPng').disabled = false; } updateMarkdown();
}
['designCode', 'testbenchCode'].forEach((id) => $(`#${id}`).addEventListener('input', () => { syncTopNames(); updateMarkdown(); }));
$('#runButton').addEventListener('click', async () => { const button = $('#runButton'); button.disabled = true; $('#runStatus').textContent = '正在调用 Icarus Verilog…'; $('#log').textContent = '$ 编译和仿真进行中…'; syncTopNames(); try { const response = await fetch('/api/simulate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ design: $('#designCode').value, testbench: $('#testbenchCode').value, designTop: $('#designTop').value, simTop: $('#simTop').value, duration: `${$('#simTime').value}${$('#simUnit').value}` }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || `仿真失败（HTTP ${response.status}）`); renderResult(result); toast('仿真完成，已更新结果'); } catch (error) { $('#resultBadge').textContent = '错误'; $('#resultBadge').className = 'badge fail'; $('#runStatus').textContent = error.message; $('#log').textContent = error.message; toast(error.message.includes('iverilog') ? 'Icarus Verilog 运行失败' : '本地仿真服务发生错误'); } finally { button.disabled = false; } });
$('#copyButton').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#markdown').textContent); toast('Markdown 已复制'); } catch { toast('复制失败，请手动复制预览内容'); } });
$('#downloadButton').addEventListener('click', () => { const blob = new Blob([$('#markdown').textContent], { type: 'text/markdown;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'dlco-exp-report.md'; link.click(); URL.revokeObjectURL(url); toast('Markdown 文件已导出'); });
$('#radixSelect').addEventListener('change', (event) => { state.radix = event.target.value; if (state.result) renderResult(state.result); else updateMarkdown(); });
$('#exportPng').addEventListener('click', () => { if (!state.result?.signals?.length) return; const blob = new Blob([waveSvg(state.result.signals)], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'waveform.svg'; link.click(); URL.revokeObjectURL(url); toast('SVG 波形已导出'); }); syncTopNames(); updateMarkdown();
