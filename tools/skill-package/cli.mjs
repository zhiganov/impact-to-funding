import { fileURLToPath } from 'node:url';
import { inspectInstallation } from './index.mjs';

export function run(args) {
  if (args.length !== 3 || args[0] !== 'inspect' || args[1] !== '--root') {
    throw new TypeError('Usage: node tools/skill-package/cli.mjs inspect --root <selected-installation>');
  }
  return inspectInstallation(args[2]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(run(process.argv.slice(2)), null, 2));
  } catch {
    console.error('Inspection failed. Choose an accessible ItF installation explicitly; see tools/skill-package/README.md.');
    process.exitCode = 1;
  }
}
