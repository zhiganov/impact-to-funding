#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkNotice, formatNotice } from './lib/notice.mjs';

// This executable belongs to the loaded skill's directory, never a PATH lookup
// or a guessed duplicate. The parent bounds the whole optional check, including
// synchronous Git inspection; a failure produces no notice and never blocks use.
const self = fileURLToPath(import.meta.url);
const selected = fileURLToPath(new URL('../../', import.meta.url));
const networkAllowed = process.argv.includes('--allow-network');

if (process.argv[2] === '--worker') {
  const result = await checkNotice(selected, { networkAllowed });
  const output = formatNotice(result);
  if (output) console.log(output);
} else {
  try {
    const child = spawn(process.execPath, [self, '--worker', ...(networkAllowed ? ['--allow-network'] : [])], {
      detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'ignore'],
    });
    let output = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (part) => { if (output.length < 4096) output += part; });
    const timedOut = await new Promise((resolve) => {
      const timer = setTimeout(() => {
        try {
          if (process.platform === 'win32') {
            const taskkill = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe');
            const result = spawnSync(taskkill, ['/PID', String(child.pid), '/T', '/F'], {
              stdio: 'ignore', windowsHide: true, timeout: 500,
            });
            if (result.status !== 0) child.kill('SIGKILL');
          } else process.kill(-child.pid, 'SIGKILL');
        } catch { /* Already exited or unavailable. */ }
        child.stdout.destroy();
        child.unref();
        resolve(true);
      }, 3500);
      const finished = () => { clearTimeout(timer); resolve(false); };
      child.once('error', finished);
      child.once('close', finished);
    });
    if (!timedOut && (output.startsWith('UPDATE_AVAILABLE: ') || output.startsWith('RELEASE_AVAILABLE: ')
      || output.startsWith('NOTICE_OFFER: '))
      && output.length <= 4096) process.stdout.write(output);
  } catch { /* Optional check is silent when execution is unavailable. */ }
}
