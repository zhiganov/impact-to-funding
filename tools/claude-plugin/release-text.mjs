#!/usr/bin/env node
// Turn a release's notes (docs/releases/vX.Y.Z.md at the tagged commit) into the
// text for its GitHub release page:
// - relative links become full links pinned to the tagged commit, because a
//   release page resolves "../install.md" against its own URL, where it leads nowhere;
// - the title line goes, since the release has its own name;
// - a source line and a "Release files" section are added, filled in from the
//   plugin build: the zip's SHA-256, the run that built it, and the runtime's
//   snapshot and dependencies, all read from the plugin's own provenance.json.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';

export function pinLinks(markdown, { repository, commit, notesPath }) {
  const base = `https://github.com/${repository}/blob/${commit}/`;
  const from = path.posix.dirname(notesPath);
  return markdown.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, text, target) => {
    if (/^([a-z]+:|#|\/)/i.test(target)) return whole;
    const [file, anchor] = target.split('#');
    const resolved = path.posix.normalize(path.posix.join(from, file));
    if (resolved.startsWith('..')) throw new Error(`Link leaves the repository: ${target}`);
    return `[${text}](${base}${resolved}${anchor ? `#${anchor}` : ''})`;
  });
}

function joinNames(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export function renderReleaseText({ notes, repository, commit, notesPath, zipName, zipSha256, runUrl, validator, provenance }) {
  const short = commit.slice(0, 7);
  const base = `https://github.com/${repository}/blob/${commit}/`;
  let body = pinLinks(notes, { repository, commit, notesPath }).replace(/^# .*\n+/, '');
  const head = [
    `Source: [\`${commit}\`](https://github.com/${repository}/commit/${commit}).`,
    '',
    `[Install or update](${base}docs/install.md) · [Managed update guide](${base}docs/managed-skill-updates.md) · [Privacy](${base}PRIVACY.md) · [Licence scope](${base}LICENSE)`,
    '',
    '',
  ].join('\n');
  const runtime = provenance.runtimeProvenance;
  const byLicence = new Map();
  for (const dep of runtime.dependencies) {
    const key = dep.license || 'licence not recorded';
    byLicence.set(key, [...(byLicence.get(key) || []), `\`${dep.name}\` ${dep.version}`]);
  }
  const deps = joinNames([...byLicence].map(([licence, names]) => `${joinNames(names)} (${licence})`));
  const check = provenance.runtimeCheck;
  const files = [
    '## Release files',
    '',
    `- **\`${zipName}\`**: the Claude Code plugin, built from \`${short}\` by the [Release plugin workflow](${runUrl}) on GitHub Actions (Node ${runtime.nodeVersion}). ${(Object.keys(provenance.files).length + 1).toLocaleString('en-GB')} files under one \`itf/\` folder. SHA-256 \`${zipSha256}\`. Two builds from this commit matched byte for byte, and \`claude plugin validate\` passed on Claude Code ${validator}. Its \`provenance.json\` lists the hash of every file.`,
    `- **Library runtime inside the plugin**: reference-library server ${runtime.serverVersion}, snapshot \`${runtime.snapshotId}\`, with ${deps}. Its check ${check.status === 'passed' ? 'passed' : `reported "${check.status}"`}: ${NUMBERS[check.tools.length] ?? check.tools.length} tools over ${check.transport}, bound to \`${check.sourceCommit.slice(0, 7)}\`. No model conversation was run.`,
    '',
    '',
  ].join('\n');
  const licence = body.search(/^Original written content/m);
  body = licence >= 0 ? body.slice(0, licence) + files + body.slice(licence) : `${body.trimEnd()}\n\n${files}`;
  return `${head}${body.trimEnd()}\n`;
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith('--') || argv[i + 1] === undefined) throw new Error(`Bad argument: ${argv[i]}`);
    out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const a = args(process.argv.slice(2));
  for (const key of ['notes', 'notes-path', 'repository', 'commit', 'plugin', 'zip', 'run-url', 'validator']) {
    if (!a[key]) {
      console.error(`Missing --${key}`);
      process.exit(2);
    }
  }
  const zipBytes = readFileSync(a.zip);
  process.stdout.write(renderReleaseText({
    notes: readFileSync(a.notes, 'utf8'),
    notesPath: a['notes-path'],
    repository: a.repository,
    commit: a.commit,
    zipName: path.basename(a.zip),
    zipSha256: createHash('sha256').update(zipBytes).digest('hex'),
    runUrl: a['run-url'],
    validator: a.validator,
    provenance: JSON.parse(readFileSync(path.join(a.plugin, 'provenance.json'), 'utf8')),
  }));
}
