import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const app = path.dirname(fileURLToPath(import.meta.url));
const pythonPath = process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python';
const venv = path.resolve(app, '../.venv', pythonPath);
const python = existsSync(venv) ? venv : 'python';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: app, stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
run(python, ['server.py', ...process.argv.slice(2)]);
