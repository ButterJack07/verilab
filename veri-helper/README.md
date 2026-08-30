# VeriLab

VeriLab 是一个面向数字逻辑课程实验的 Verilog 仿真与实验报告整理工具。
它将代码编辑、Icarus Verilog 仿真、VCD 波形解析、真值表生成、过程截图整理和 LaTeX 报告导出集中到一个网页工作台中。

## 功能概览

### 快速仿真模式

适合临时验证一个模块：

- 输入 Verilog 设计代码（DUT）
- 输入 Testbench 激励代码
- 自动识别常见的设计顶层和测试顶层
- 调用 `iverilog` 编译
- 调用 `vvp` 运行仿真
- 自动补充 VCD 记录代码
- 兼容 `$stop`，批处理运行时会转换为 `$finish`
- 解析 VCD 中的数字信号变化
- 生成测试观测表
- 支持 BIN、HEX、DEC 显示切换
- 导出 SVG 波形

### 完整实验报告模式

适合按照课程实验报告模板组织完整内容：

- 报告编号，例如 `1`
- 报告名称，例如 `选择器与编码器`
- 自动生成主标题：`实验一：选择器与编码器`
- 填写课程、姓名、班级、学号、邮箱和实验时间
- 填写实验目的、实验原理、问题与分析、实验总结和心得体会
- 新建多个子实验：`1-1`、`1-2`、`1-3`
- 每个子实验独立保存代码、Testbench 和仿真结果
- 每个子实验添加四张流程截图
- 自动生成测试结果表和报告预览
- 导出完整 LaTeX 文件

## 四张流程截图

每个子实验包含四个固定截图位置，参考标准实验报告中的实验过程：

1. `图片 1：编写 Verilog`
2. `图片 2：编写约束文件`
3. `图片 3：综合 / 实现`
4. `图片 4：仿真验证`

截图添加方式：

- 点击对应截图框
- 使用 `Ctrl + V` 粘贴系统剪贴板中的截图
- 也可以点击截图区域并选择本地图片文件

建议使用 Windows 截图快捷键：

```text
Win + Shift + S
```

截图之后先点击目标框，再按 `Ctrl + V`。不同浏览器或远程桌面环境可能会限制剪贴板图片访问；如果粘贴无效，可以使用文件选择作为备用方式。

## 环境要求

### 本地运行

- Windows、Linux 或 macOS
- Node.js 18 或更高版本
- Icarus Verilog，包含 `iverilog` 和 `vvp`
- 支持现代 JavaScript 的浏览器

### Windows 安装 Icarus Verilog

如果已经安装 `winget`，可以执行：

```powershell
winget install --id Icarus.Verilog --exact --accept-package-agreements --accept-source-agreements
```

VeriLab 会自动检查以下路径：

```text
C:\iverilog\bin\iverilog.exe
C:\Program Files\iverilog\bin\iverilog.exe
C:\Program Files\Icarus Verilog\bin\iverilog.exe
```

也会检查系统 `PATH`。

安装后可以验证：

```powershell
iverilog -V
vvp -V
```

如果当前终端没有刷新环境变量，可以直接重新打开终端。VeriLab 在 Windows 上也会直接使用 `C:\iverilog\bin` 下的绝对路径。

## 本地启动

进入项目目录：

```powershell
cd C:\Users\zheng\Desktop\vibeGAME\veri-helper
```

启动服务：

```powershell
npm start
```

也可以使用：

```powershell
npm run start:local
```

浏览器打开：

```text
http://localhost:4173/
```

健康检查：

```text
http://localhost:4173/health
```

健康检查正常时会返回类似：

```json
{"ok":true,"service":"verilab"}
```

## 使用快速仿真模式

1. 点击顶部的“快速仿真”。
2. 在设计代码框粘贴 DUT。
3. 在激励代码框粘贴 Testbench。
4. 确认设计顶层和仿真顶层。
5. 点击“开始仿真”。
6. 查看编译日志、仿真结果表和波形。
7. 选择 BIN、HEX 或 DEC 查看多位信号。
8. 导出 SVG 波形。

如果 Testbench 没有波形记录代码，服务端会自动补充：

```verilog
initial begin
  $dumpfile("wave.vcd");
  $dumpvars(0, testbench_top);
end
```

为了得到更明确的 PASS/FAIL 日志，也可以在 Testbench 中加入：

```verilog
$display("X=%b valid=%b led_code=%d F=%b", X, valid, led_code, F);
```

## 使用完整实验报告模式

1. 点击顶部的“完整实验报告”。
2. 填写报告编号，例如 `1`。
3. 填写实验名称，例如 `选择器与编码器`。
4. 页面会自动生成：

```text
实验一：选择器与编码器
```

5. 点击“新建子实验”。
6. 子实验会按照报告编号自动生成：

```text
1-1
1-2
1-3
```

7. 为每个子实验填写实验思路、实验步骤和结果分析。
8. 粘贴设计代码和 Testbench。
9. 点击该子实验的“仿真”按钮。
10. 添加四张对应流程截图。
11. 在底部预览完整报告。
12. 点击“导出 `.tex`”。

报告编号决定子实验编号的前缀；实验名称用于生成报告主标题；每个子实验的名称只决定该子实验的标题内容。

## LaTeX 导出

导出文件默认名：

```text
experiment-report.tex
```

导出的报告包含：

- 报告标题和个人信息
- 实验目的
- 实验原理
- 实验环境
- 所有子实验
- Verilog 代码
- Testbench 代码
- 测试结果表
- 实验步骤截图引用
- 结果分析
- 问题与分析
- 实验总结
- 心得体会

代码使用 `verbatim` 环境，避免普通 Verilog 字符破坏 LaTeX：

```latex
\begin{verbatim}
module example;
endmodule
\end{verbatim}
```

### 编译 PDF

推荐使用 XeLaTeX：

```bash
xelatex experiment-report.tex
```

如果报告中包含外部图片、SVG 或需要额外转换，可以使用：

```bash
xelatex --shell-escape experiment-report.tex
```

也可以将 `.tex` 上传到 Overleaf 编译。

## 项目结构

```text
veri-helper/
├── index.html              # 主页面
├── styles.css              # 主页面样式
├── app.js                  # 前端状态、编辑器、报告和导出逻辑
├── server.js               # Node 本地/云端服务和仿真接口
├── package.json            # 启动命令
├── Dockerfile              # 云端 Docker 镜像
├── render.yaml             # Render 部署配置
├── template-preview.css    # 模板预览公共样式
├── test01.html ... test11.html
└── .gitignore              # 忽略仿真临时文件
```

## 仿真接口

后端接口：

```text
POST /api/simulate
```

请求 JSON：

```json
{
  "design": "module ... endmodule",
  "testbench": "module ... endmodule",
  "designTop": "exp2",
  "simTop": "exp2_tb",
  "duration": "1000ns"
}
```

服务端会在系统临时目录创建独立仿真目录，写入 `design.v` 和 `testbench.v`，完成编译、运行和 VCD 解析后返回结果。

## 云端部署

GitHub 本身只能存储代码，不能直接运行 Node.js 后端或 Icarus Verilog。因此公网使用需要部署到 Render、Railway 或其他容器平台。

项目已经提供：

- `Dockerfile`
- `render.yaml`
- `PORT` 环境变量支持
- `/health` 健康检查

### Render 部署

1. 登录 Render。
2. 选择 `New` → `Blueprint`。
3. 选择 `ButterJack07/verilab` 仓库。
4. Render 读取 `veri-helper/render.yaml`。
5. 使用 Docker 构建服务。
6. Docker 镜像会安装 Linux 版 Icarus Verilog。
7. 部署完成后获得公网 URL。

Docker 构建的核心步骤：

```dockerfile
FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends iverilog
CMD ["npm", "start"]
```

本地 Windows 和云端 Linux 使用同一份 `server.js`：

- Windows 优先查找绝对路径下的 `.exe`
- Linux 使用系统 PATH 中的 `iverilog` 和 `vvp`
- 端口由 `PORT` 环境变量控制，默认本地端口为 `4173`

## 安全说明

VeriLab 会执行用户提交的 Verilog 仿真代码。公开部署时请注意：

- 不要直接暴露无认证的仿真接口
- 增加用户登录或访问密码
- 限制请求大小
- 限制单次仿真时间
- 限制 CPU 和内存
- 限制并发任务数量
- 不要直接允许执行任意 TCL、Shell 或系统命令
- 云端建议使用隔离容器和临时工作目录

当前版本适合个人本地使用和受控演示环境，不建议直接作为开放公共仿真平台。

## 常见问题

### 提示找不到 `counter_tb`

检查 Testbench 顶层是否实际为：

```verilog
module exp2_tb;
```

并将仿真顶层填写为：

```text
exp2_tb
```

VeriLab 会自动优先识别名称中包含 `tb` 或 `testbench` 的模块。

### 仿真成功但没有波形

确认 Testbench 中包含：

```verilog
$dumpfile("wave.vcd");
$dumpvars(0, exp2_tb);
```

如果没有，VeriLab 会尝试自动插入；如果 Testbench 结构非常特殊，建议手动添加。

### 测试表没有 PASS/FAIL

没有 `$display` 或断言时，程序只能确认仿真是否运行完成，不能推断设计逻辑是否符合预期。建议在 Testbench 中加入 `$display` 或显式比较逻辑。

### 页面显示旧版本

使用强制刷新：

```text
Ctrl + F5
```

### 服务无法访问

重新启动：

```bash
npm start
```

然后检查：

```text
http://localhost:4173/health
```

## 当前状态

当前版本已经支持本地和 Docker 云端运行，完整实验报告模式正在持续完善。报告模板、章节顺序和截图标题可以根据课程提供的正式 Word 模板继续调整。
