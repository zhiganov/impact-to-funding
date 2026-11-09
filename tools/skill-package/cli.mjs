import { fileURLToPath } from 'node:url';
import { createManager, HELPER_VERSION, inspectInstallation } from './index.mjs';

const usage = `ItF skill manager ${HELPER_VERSION}
Usage:
  itf inspect --root <selected-installation>
  itf <install|check|update|adopt|rollback|recover> --harness <claude|codex|opencode>
      --scope <project|personal> [--project <directory>] [--channel <stable|prerelease>]
      [--release <vX.Y.Z> | --commit <full-sha> | --follow-channel]
      [--ack-duplicates] [--allow-downgrade] [--apply]

Without --apply, operations only report a plan. check never changes files.
adopt asserts ownership of an existing copy; rollback/recover preserve recovery.
Output contains private local paths: do not publish it or send it to a version API.
No hooks, global configuration, telemetry or host/model call is installed/run.`;

export async function run(args, { onPlan } = {}) {
  if (args.length === 0 || args.includes('--help')) return { help: usage };
  if (args.length === 1 && args[0] === '--version') return { helperVersion: HELPER_VERSION };
  if (args[0] === 'inspect') {
    if (args.length !== 3 || args[1] !== '--root') throw new TypeError('Use inspect --root <selected-installation>');
    return inspectInstallation(args[2]);
  }
  const values = { '--harness': 'harness', '--scope': 'scope', '--project': 'project',
    '--channel': 'channel', '--release': 'release', '--commit': 'commit' };
  const flags = { '--apply': 'apply', '--ack-duplicates': 'ackDuplicates',
    '--allow-downgrade': 'allowDowngrade', '--follow-channel': 'followChannel' };
  const options = { onPlan };
  for (let i = 1; i < args.length; i += 1) {
    const key = args[i];
    if (Object.hasOwn(flags, key)) {
      if (options[flags[key]]) throw new TypeError('Repeated option');
      options[flags[key]] = true;
    } else if (Object.hasOwn(values, key) && args[i + 1] && !args[i + 1].startsWith('--')) {
      if (Object.hasOwn(options, values[key])) throw new TypeError('Repeated option');
      options[values[key]] = args[++i];
    } else throw new TypeError('Unknown or missing option; run itf --help');
  }
  return createManager().run(args[0], options);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await run(process.argv.slice(2), {
      onPlan: (plan) => { if (process.argv.includes('--apply')) console.error(JSON.stringify({ beforeChange: plan })); },
    }), null, 2));
  } catch (error) {
    console.error(`ItF: ${error.code ?? error.message}. See tools/skill-package/README.md; do not discard local or recovery files.`);
    process.exitCode = 1;
  }
}
