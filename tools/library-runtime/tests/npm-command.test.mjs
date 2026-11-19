import assert from 'node:assert/strict';
import test from 'node:test';
import { npmCommand } from '../../skill-package/lib/runtime-source.mjs';

test('npm starts directly on POSIX hosts', () => {
  assert.deepEqual(npmCommand({ platform: 'linux', execPath: '/usr/bin/node', exists: () => false }),
    { file: 'npm', prefix: [] });
  assert.deepEqual(npmCommand({ platform: 'darwin', execPath: '/opt/node/bin/node', exists: () => false }),
    { file: 'npm', prefix: [] });
});

test('on Windows npm runs as the npm CLI next to this Node, without a shell', () => {
  const execPath = 'C:\\Program Files\\nodejs\\node.exe';
  const cli = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
  assert.deepEqual(npmCommand({ platform: 'win32', execPath, exists: (file) => file === cli }),
    { file: execPath, prefix: [cli] });
});

test('on Windows a Node install without its bundled npm stops with a clear error', () => {
  assert.throws(() => npmCommand({ platform: 'win32', execPath: 'C:\\node\\node.exe', exists: () => false }),
    /npm was not found next to this Node install/);
});
