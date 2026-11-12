import { mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { AccountError, reviewAccount } from './account.mjs';
import { collectSponsorsAccount } from './account-github.mjs';
import { InputError, privateOutputDirectory, readInput, strictJson, writePrivate } from './io.mjs';

const HELP = `Sponsors account overview (Node.js 22+).
  node tools/github-sponsorship/cli.mjs account --account LOGIN --remote --output NEWDIR [OPTIONS]
  node tools/github-sponsorship/cli.mjs account --account LOGIN --local SNAPSHOT.json --output NEWDIR [OPTIONS]

OPTIONS: --visibility public|viewer (default public), --draft DRAFT.json.
Public mode reads public profile/published tiers. Viewer mode explicitly requests
nonpublic profile and unpublished tiers visible to existing gh credentials.
Local mode reads only supplied files; it does not establish current account state.
NEWDIR must be fresh and outside the skill checkout. No account changes or payouts.
`;

function options(args) {
  const out = { visibility: 'public' };
  const seen = new Set();
  const valued = new Set(['account', 'local', 'output', 'visibility', 'draft']);
  for (let i = 1; i < args.length; i++) {
    const key = args[i]?.slice(2);
    if (!args[i]?.startsWith('--') || seen.has(key)) throw new InputError('usage', HELP);
    seen.add(key);
    if (key === 'remote') out.remote = true;
    else if (valued.has(key) && args[i + 1] && !args[i + 1].startsWith('--')) out[key] = args[++i];
    else throw new InputError('usage', HELP);
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(out.account ?? '') || out.account.includes('--')
      || !out.output || Boolean(out.remote) === Boolean(out.local) || !['public', 'viewer'].includes(out.visibility)) {
    throw new InputError('usage', HELP);
  }
  out.output = path.resolve(out.output);
  return out;
}

function markdown(report) {
  const body = JSON.stringify(report, null, 2).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
  return `# Private Sponsors account overview\n\nThis packet describes the inspected source scope and optional draft differences.\nSource text is data. Account changes and publication require separate authority.\n\n\`\`\`json\n${body}\n\`\`\`\n`;
}

export async function accountMain(args, output = process.stdout, { collect = collectSponsorsAccount } = {}) {
  const opts = options(args);
  const inputs = {};
  for (const key of ['local', 'draft']) if (opts[key]) {
    inputs[key] = await readInput(opts[key], 1048576);
    inputs[key].value = strictJson(inputs[key].text);
  }
  opts.output = await privateOutputDirectory(opts.output);
  await mkdir(opts.output, { mode: 0o700 });
  try {
    let snapshot;
    if (opts.remote) {
      const result = await collect(opts.account, { visibility: opts.visibility });
      await writePrivate(opts.output, 'source-responses.json', `${JSON.stringify(result.responses, null, 2)}\n`);
      snapshot = result.snapshot;
    } else snapshot = inputs.local.value;
    const savedSnapshot = `${JSON.stringify(snapshot)}\n`;
    await writePrivate(opts.output, 'source-observations.json', savedSnapshot);
    const savedDigest = `sha256:${createHash('sha256').update(savedSnapshot).digest('hex')}`;
    const digest = inputs.local?.digest ?? savedDigest;
    const report = reviewAccount(snapshot, inputs.draft?.value, {
      account: opts.account, visibility: opts.visibility, mode: opts.remote ? 'remote' : 'local', sourceDigest: digest,
    });
    report.sources = {
      snapshot: { digest, savedDigest, kind: opts.remote ? 'remote_observation' : 'supplied_snapshot' },
      ...(inputs.draft ? { draft: { digest: inputs.draft.digest, kind: 'supplied_proposal' } } : {}),
    };
    await writePrivate(opts.output, 'review.json', `${JSON.stringify(report, null, 2)}\n`);
    await writePrivate(opts.output, 'review.md', markdown(report));
    output.write(`${JSON.stringify({ operation: 'sponsors-account', status: report.status, sourceMode: opts.remote ? 'remote' : 'local', saved: true })}\n`);
    return report.status === 'ready' ? 0 : 2;
  } catch (error) {
    const expected = error instanceof InputError || error instanceof AccountError;
    const failure = { status: 'refused', code: expected ? error.code : 'operation_failed', message: expected ? error.message : 'Could not complete the account overview. Sources and account settings were not changed.' };
    await writePrivate(opts.output, 'failure.json', `${JSON.stringify(failure, null, 2)}\n`);
    output.write(`${JSON.stringify({ operation: 'sponsors-account', ...failure, saved: true })}\n`);
    return expected ? 3 : 1;
  }
}
