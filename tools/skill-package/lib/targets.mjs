import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { sourceGit } from './git.mjs';

const projectFolders = { claude: '.claude/skills', codex: '.agents/skills', opencode: '.opencode/skills' };

function declaredName(text) {
  const header = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!header) return null;
  const names = [...header.matchAll(/^name:\s*([^\r\n]*)\r?$/gm)];
  if (!names.length) return null;
  if (names.length !== 1) throw new Error('Ambiguous skill name; duplicate discovery is incomplete');
  const value = names[0][1].trim();
  if (value.startsWith('"')) {
    const quoted = value.match(/^("(?:[^"\\]|\\.)*")(?:\s+#.*)?$/)?.[1];
    if (quoted) return JSON.parse(quoted);
  } else if (value.startsWith("'")) {
    const quoted = value.match(/^'((?:[^']|'')*)'(?:\s+#.*)?$/)?.[1];
    if (quoted !== undefined) return quoted.replaceAll("''", "'");
  } else if (value && !/^[!&*|>\[\]{}%@`]/.test(value)) return value.replace(/\s+#.*$/, '').trim();
  throw new Error('Unrecognised skill name; duplicate discovery is incomplete');
}

export function assertPlainPath(value) {
  let cursor = path.resolve(value);
  while (true) {
    if (existsSync(cursor) || (() => { try { return lstatSync(cursor).isSymbolicLink(); } catch { return false; } })()) {
      if (lstatSync(cursor).isSymbolicLink()) throw new Error('Refusing a symlinked installation or state path');
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) return;
    cursor = parent;
  }
}

export function targetPaths({ harness, scope, project = process.cwd(), home = homedir(), configHome } = {}) {
  if (!Object.hasOwn(projectFolders, harness)) throw new TypeError('Choose claude, codex or opencode');
  if (!['project', 'personal'].includes(scope)) throw new TypeError('Choose project or personal scope explicitly');
  const projectRoot = realpathSync(path.resolve(project));
  const homeRoot = realpathSync(path.resolve(home));
  const config = path.resolve(configHome ?? process.env.XDG_CONFIG_HOME ?? path.join(homeRoot, '.config'));
  const personalFolders = { claude: path.join(homeRoot, '.claude/skills'), codex: path.join(homeRoot, '.agents/skills'), opencode: path.join(config, 'opencode/skills') };
  const target = path.join(scope === 'project' ? path.join(projectRoot, projectFolders[harness]) : personalFolders[harness], 'impact-to-funding');
  const key = createHash('sha256').update(target).digest('hex');
  // State/backups stay private and outside every skills-discovery root.
  const state = path.join(homeRoot, '.local/state/impact-to-funding', key);
  return { harness, scope, project: projectRoot, home: homeRoot, target, state, config, personalFolders };
}

export function discoverCopies(paths) {
  const roots = new Set(Object.values(paths.personalFolders));
  let boundary = paths.project;
  try { boundary = realpathSync(sourceGit(['-C', paths.project, 'rev-parse', '--show-toplevel']).trim()); } catch { /* Non-Git projects stop at the selected directory. */ }
  let directory = paths.project;
  while (true) {
    for (const relative of Object.values(projectFolders)) roots.add(path.join(directory, relative));
    if (directory === boundary || path.dirname(directory) === directory) break;
    directory = path.dirname(directory);
  }
  const copies = new Set();
  let visited = 0;
  function walk(directory, depth) {
    if (!existsSync(directory)) return;
    if (++visited > 2000 || depth > 6) throw new Error('Default-folder discovery is incomplete; inspect duplicates manually');
    const entry = path.join(directory, 'SKILL.md');
    if (existsSync(entry)) {
      if (lstatSync(entry).size > 65536) throw new Error('Skill metadata is too large for duplicate discovery');
      if (path.basename(directory) === 'impact-to-funding'
        || declaredName(readFileSync(entry, 'utf8')) === 'impact-to-funding') copies.add(path.resolve(directory));
      return;
    }
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      if (!item.name.startsWith('.') && item.name !== 'node_modules' && (item.isDirectory() || item.isSymbolicLink())) {
        walk(path.join(directory, item.name), depth + 1);
      }
    }
  }
  for (const root of roots) walk(root, 0);
  return [...copies].filter((copy) => copy !== paths.target).sort();
}
