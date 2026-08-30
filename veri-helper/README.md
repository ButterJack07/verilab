# VeriLab

VeriLab is a local/cloud web assistant for running small Verilog experiments with Icarus Verilog. It accepts a DUT and a testbench, runs `iverilog`/`vvp`, parses VCD signals, renders an observation table and exports Markdown.

## Local

```bash
npm start
```

Open `http://localhost:4173`.

On Windows, the server automatically checks `C:\iverilog\bin` and common installation directories before checking `PATH`. You can also use `npm run start:local`; both commands use the same local-compatible server.

## Deploy with Render

This repository includes `render.yaml` and a `Dockerfile`. Create a Render Web Service from this GitHub repository and use the Blueprint configuration. The Docker image installs Icarus Verilog and starts the Node server. Render provides `PORT`, which the server reads automatically.

The service health endpoint is `/health`.

## Notes

- Each simulation runs in a temporary directory inside the server container.
- The free Render instance may sleep when idle.
- Do not run untrusted Verilog/TCL code on a public deployment without adding authentication and resource limits.
