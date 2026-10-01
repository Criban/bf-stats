const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const runtime = path.join(root, 'node_modules', 'node', 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
const result = spawnSync(runtime, [path.join(__dirname, 'snapshot-bf6.mjs')], { stdio: 'inherit', cwd: root });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
