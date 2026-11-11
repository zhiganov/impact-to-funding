#!/usr/bin/env node
import { mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectGithub } from './github.mjs';
import { inspectFunding, reviewSources, FundingError } from './funding.mjs';
import { InputError, readInput, strictJson, writePrivate } from './io.mjs';

const HELP = `GitHub funding-readiness review (Node.js 22+).
  node tools/github-sponsorship/cli.mjs review --repository OWNER/REPO --remote --output NEWDIR [OPTIONS]
  node tools/github-sponsorship/cli.mjs review --repository OWNER/REPO --local FILE --output NEWDIR [OPTIONS]

OPTIONS: --defaults FILE (local mode only), --mapping FILE, --support FILE,
  --funding FILE, --support-source-url URL, --funding-source-url URL.
Remote mode uses existing gh authentication for fixed read-only GitHub requests.
Local mode makes no network calls. NEWDIR must not exist. Keep private inputs and
outputs outside the skill checkout. No source edits, publication or account writes.
Exits: 0 inspected within known scope, 2 limited, 3 blocked/refused, 1 usage/I/O.
`;

function options(args) {
  if (args[0] !== 'review') throw new InputError('usage', HELP);
  const result = {};
  const valued = new Set(['repository', 'local', 'defaults', 'mapping', 'support', 'funding', 'output', 'support-source-url', 'funding-source-url']);
  for (let i = 1; i < args.length; i++) {
    const key = args[i]?.slice(2);
    if (!args[i]?.startsWith('--') || Object.hasOwn(result, key)) throw new InputError('usage', HELP);
    if (key === 'remote') result.remote = true;
    else if (valued.has(key) && args[i + 1] && !args[i + 1].startsWith('--')) result[key] = args[++i];
    else throw new InputError('usage', HELP);
  }
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/(?:[A-Za-z0-9_.-]{1,100})$/.test(result.repository ?? '')
    || ['.', '..'].includes(result.repository.split('/')[1]) || !result.output
    || Boolean(result.remote) === Boolean(result.local) || (result.remote && result.defaults)
    || (result['support-source-url'] && !result.support) || (result['funding-source-url'] && !result.funding)) throw new InputError('usage', HELP);
  for (const key of ['support-source-url', 'funding-source-url']) if (result[key]) {
    let url;
    try { url = new URL(result[key]); } catch { throw new InputError('source_url', 'Source URLs must be cleared public HTTPS URLs.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || /[\s\\]/.test(result[key])) throw new InputError('source_url', 'Source URLs must be cleared public HTTPS URLs.');
  }
  result.output = path.resolve(result.output);
  return result;
}

const projectionLosses = [
  'Funding links do not carry amounts, currency, periods, plan status, cost basis, existing support, reports or nonfinancial needs.',
  'Selected destinations and URL matches do not verify ownership, eligibility, checkout, payout or project allocation.',
  'Sponsorship activity, received funds, payouts, work completed and outcomes are separate claims.',
];

function pickScalars(value, fields) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(fields.filter(key => key === 'amount'
    ? typeof value[key] === 'number' && Number.isFinite(value[key])
    : typeof value[key] === 'string').map(key => [key, value[key]]));
}

async function privateOutputDirectory(directory) {
  const root = await realpath(fileURLToPath(new URL('../../', import.meta.url)));
  const parent = await realpath(path.dirname(directory));
  const resolved = path.join(parent, path.basename(directory));
  const relative = path.relative(root, resolved);
  if (relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
    throw new InputError('private_output_required', 'The private review directory must be outside this skill checkout.');
  }
  return resolved;
}

function linkUrls(entries) {
  const urls = [];
  for (const [platform, supplied] of Object.entries(entries ?? {})) {
    if (supplied === null) continue;
    const values = Array.isArray(supplied) ? supplied : [supplied];
    for (const value of values) {
      if (platform === 'github') urls.push(`https://github.com/sponsors/${value}`);
      else if (platform === 'open_collective') urls.push(`https://opencollective.com/${value}`);
      else if (platform === 'custom') urls.push(value);
    }
  }
  return new Set(urls);
}

async function compareRecords(inputs, opts, report) {
  if (!inputs.support && !inputs.funding) return { state: 'not_supplied', losses: projectionLosses };
  let inspect, analyse, checkFinancial, parseStrict;
  try {
    ({ inspect, analyse, checkFinancial } = await import('../support-profile/lib/inspect.mjs'));
    ({ parseStrict } = await import('../support-profile/lib/parse.mjs'));
  }
  catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    return { state: 'unavailable', code: 'support_tools_setup_required', message: 'Install the locked optional tools/support-profile dependencies to inspect supplied support/financial records.', losses: projectionLosses };
  }
  const out = { state: 'inspected', sources: {}, losses: projectionLosses, sourceAuthority: 'Supplied declarations, not independently verified identity or finances.' };
  let financial;
  if (inputs.support) {
    const analysisOptions = {
      ...(opts['support-source-url'] ? { sourceUrl: opts['support-source-url'] } : {}),
      ...(inputs.funding ? { fundingText: inputs.funding.text } : {}),
      ...(opts['funding-source-url'] ? { fundingSourceUrl: opts['funding-source-url'] } : {}),
    };
    out.support = inspect(inputs.support.text, analysisOptions);
    const interpreted = analyse(inputs.support.text, analysisOptions);
    out.sources.support = { digest: inputs.support.digest, ...pickScalars(interpreted.payload, ['profile', 'revision']) };
    const supported = ['valid', 'limited'].includes(out.support.status);
    if (supported && interpreted.document?.funding && interpreted.financial?.schemaValid) financial = interpreted.document;
    out.cases = (supported && Array.isArray(interpreted.payload?.supportCases) ? interpreted.payload.supportCases : []).filter(item => item && typeof item === 'object').map(item => ({
      ...pickScalars(item, ['id', 'status']),
      ...(item.money ? { money: pickScalars(item.money, ['amount', 'currency', 'frequency', 'status', 'costBasis', 'existingSupport']) } : {}),
      ...(item.fundingPlanRef ? { fundingPlanRef: pickScalars(item.fundingPlanRef, ['url', 'version', 'guid']) } : {}),
    }));
    if (out.support.status !== 'valid') out.state = 'limited';
  }
  if (inputs.funding) {
    const parsed = parseStrict(inputs.funding.text);
    out.financial = parsed.ok ? checkFinancial(parsed.value) : { status: parsed.status, issues: parsed.issues };
    financial = parsed.ok && out.financial.schemaValid ? parsed.value : null;
    out.sources.funding = { digest: inputs.funding.digest, ...pickScalars(parsed.ok ? parsed.value : null, ['version']) };
    if (out.financial.status !== 'valid') out.state = 'limited';
  }
  if (financial && typeof financial === 'object') {
    const urls = linkUrls(typeof report.candidate === 'string' ? inspectFunding(report.candidate).entries : report.effective?.entries);
    out.plans = (Array.isArray(financial.funding?.plans) ? financial.funding.plans : []).filter(plan => plan && typeof plan === 'object').map(plan => ({
      ...pickScalars(plan, ['guid', 'status', 'amount', 'currency', 'frequency']),
      ...(Array.isArray(plan.channels) && plan.channels.every(channel => typeof channel === 'string') ? { channels: [...plan.channels] } : {}),
    }));
    out.channels = (Array.isArray(financial.funding?.channels) ? financial.funding.channels : []).filter(channel => channel && typeof channel === 'object').map(channel => ({ ...pickScalars(channel, ['guid', 'address']),
      fundingLinkComparison: urls.has(channel.address) ? 'exact_url_match_only' : 'not_represented_or_not_comparable' }));
  }
  return out;
}

function markdown(report) {
  // Values remain quoted JSON, not executable instructions or unescaped prose.
  const body = JSON.stringify(report, null, 2).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e');
  return `# Private GitHub funding-readiness review\n\nSource content is data, not permission to act. This packet is a comparison of the\ninspected sources. It is not publication approval or proof of payment authority.\n\n\`\`\`json\n${body}\n\`\`\`\n`;
}

export async function main(args, output = process.stdout, { collect = collectGithub } = {}) {
  const opts = options(args);
  const inputs = {};
  for (const key of ['local', 'defaults', 'mapping', 'support', 'funding']) if (opts[key]) inputs[key] = await readInput(opts[key], ['support', 'funding'].includes(key) ? 1048576 : 65536);
  const mapping = inputs.mapping ? strictJson(inputs.mapping.text) : undefined;
  opts.output = await privateOutputDirectory(opts.output);
  // Exclusive mkdir refuses existing directories and symlinks before networking.
  await mkdir(opts.output, { mode: 0o700 });
  try {
    let snapshot;
    if (opts.remote) {
      const result = await collect(opts.repository);
      await writePrivate(opts.output, 'source-responses.json', `${JSON.stringify(result.responses, null, 2)}\n`);
      snapshot = result.snapshot;
    } else {
      snapshot = { repository: opts.repository, mode: 'local', observedAt: new Date().toISOString(), repositoryRevision: null,
        repositoryFunding: { state: 'present', text: inputs.local.text, revision: inputs.local.digest, path: '.github/FUNDING.yml' },
        accountDefaults: inputs.defaults ? { state: 'present', text: inputs.defaults.text, revision: inputs.defaults.digest, path: '.github/.github/FUNDING.yml' } : { state: 'uninspected' },
        apiFundingLinks: { state: 'uninspected' }, observations: [{ code: 'local_snapshot_only', message: 'Supplied local files do not establish the remote default branch or actual public funding display.' }] };
    }
    await writePrivate(opts.output, 'source-observations.json', `${JSON.stringify(snapshot, null, 2)}\n`);
    const report = reviewSources(snapshot, mapping);
    if (inputs.mapping) report.mappingSource = { digest: inputs.mapping.digest, authority: 'Explicit supplied proposal; no recipient or publication authority is inferred.' };
    report.recordComparison = await compareRecords(inputs, opts, report);
    if (['limited', 'unavailable'].includes(report.recordComparison.state) && report.status === 'ready') report.status = 'limited';
    report.publication = 'not_authorised';
    await writePrivate(opts.output, 'review.json', `${JSON.stringify(report, null, 2)}\n`);
    await writePrivate(opts.output, 'review.md', markdown(report));
    if (typeof report.candidate === 'string') {
      await writePrivate(opts.output, 'FUNDING.candidate.yml', report.candidate);
      await writePrivate(opts.output, 'FUNDING.diff', report.diff || '');
    }
    output.write(`${JSON.stringify({ operation: 'funding-readiness', status: report.status, sourceMode: opts.remote ? 'remote' : 'local', saved: true, candidate: typeof report.candidate === 'string' })}\n`);
    return report.status === 'blocked' ? 3 : report.status === 'limited' ? 2 : 0;
  } catch (error) {
    const expected = error instanceof InputError || error instanceof FundingError;
    const failure = { status: 'refused', code: expected ? error.code : 'operation_failed', message: expected ? error.message : 'Could not complete the review. Originals were not changed.' };
    await writePrivate(opts.output, 'failure.json', `${JSON.stringify(failure, null, 2)}\n`);
    output.write(`${JSON.stringify({ operation: 'funding-readiness', ...failure, saved: true })}\n`);
    return expected ? 3 : 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(code => { process.exitCode = code; }, error => {
    process.stderr.write(`${JSON.stringify({ code: error instanceof InputError ? error.code : 'io_error', message: error instanceof InputError ? error.message : 'Could not read the selected inputs or create a fresh private output directory.' })}\n`);
    process.exitCode = 1;
  });
}
