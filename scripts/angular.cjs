const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const runtime = path.join(root, 'node_modules', 'node', 'bin', process.platform === 'win32' ? 'node.exe' : 'node');
const cli = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const result = spawnSync(runtime, [cli, ...process.argv.slice(2)], { stdio: 'inherit', cwd: root });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
