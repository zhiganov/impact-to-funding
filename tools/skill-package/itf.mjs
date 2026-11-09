#!/usr/bin/env node
import { run } from './cli.mjs';

try {
  const result = await run(process.argv.slice(2), {
    onPlan: (plan) => { if (process.argv.includes('--apply')) console.error(JSON.stringify({ beforeChange: plan })); },
  });
  console.log(result.help ?? JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`ItF: ${error.code ?? error.message}. Preserve local/recovery files; run itf --help for usage.`);
  process.exitCode = 1;
}
