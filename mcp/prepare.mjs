import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BOUNDS, createSnapshot, permittedPath } from './library.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

// Only read committed regular blobs from this producer's fixed public mapping.
function publicBlob(revision, path, maxBytes = 1024 * 1024) {
  const entry = execFileSync('git', ['ls-tree', revision, '--', path], { cwd: root, encoding: 'utf8', timeout: 5000, stdio: 'pipe' }).trim();
  if (!/^100(?:644|755) blob [0-9a-f]{40}\t/.test(entry)) throw new Error('Not a permitted committed regular file.');
  const blobId = entry.split(' ')[2].split('\t')[0];
  const size = Number(execFileSync('git', ['cat-file', '-s', blobId], { cwd: root, encoding: 'utf8', timeout: 5000, stdio: 'pipe' }));
  // A bounded marker retains the too-large distinction without reading a huge blob.
  if (size > maxBytes) return Buffer.alloc(maxBytes + 1);
  return execFileSync('git', ['show', `${revision}:${path}`], { cwd: root, timeout: 5000, maxBuffer: 1024 * 1024, stdio: 'pipe' });
}

export function prepare(revision) {
  if (typeof revision !== 'string' || revision.length !== 40 || !/^[0-9a-f]{40}$/.test(revision)) throw new Error('Use a full lowercase 40-character source commit.');
  const type = execFileSync('git', ['cat-file', '-t', revision], { cwd: root, encoding: 'utf8', timeout: 5000, stdio: 'pipe' }).trim();
  if (type !== 'commit') throw new Error('The source revision must identify a commit object, not a tag, tree or blob.');
  const mapping = JSON.parse(readFileSync(new URL('./mapping.json', import.meta.url), 'utf8'));
  const indexBytes = publicBlob(revision, mapping.indexPath);
  const indexMarkdown = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(indexBytes);
  const indexRevision = indexMarkdown.match(/\bindex revision (\d+)\b/i);
  if ((indexRevision ? Number(indexRevision[1]) : null) !== mapping.indexRevision) throw new Error('Index revision does not match the frozen mapping.');
  const documents = Object.create(null);
  for (const path of new Set(mapping.records.map((record) => record?.documentPath))) {
    if (!permittedPath(path)) continue;
    try {
      const bytes = publicBlob(revision, path, BOUNDS.maxDocumentBytes);
      if (bytes.length > BOUNDS.maxDocumentBytes) {
        documents[path] = bytes;
        continue;
      }
      // A revision mismatch makes that declared record unavailable, never relabels it.
      const markdown = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
      const declared = markdown.match(/\brecord revisions?:? (\d+)\b/i);
      if (!declared || mapping.records.some((record) => record.documentPath === path && record.recordRevision !== Number(declared[1]))) continue;
      documents[path] = bytes;
    } catch {
      // Missing, non-regular, undecodable and unreadable declared records remain counted.
    }
  }
  return createSnapshot({ sourceRevision: revision, mapping, documents, indexMarkdown });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--revision' || args[2] !== '--output') {
    console.error('Usage: node mcp/prepare.mjs --revision FULL_SOURCE_COMMIT --output UNUSED_SNAPSHOT_FILE');
    process.exitCode = 1;
  } else {
    try {
      const snapshot = prepare(args[1]);
      // Do not overwrite any existing application, source or snapshot file.
      writeFileSync(args[3], `${JSON.stringify(snapshot, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ snapshotId: snapshot.snapshotId, sourceRevision: snapshot.sourceRevision,
        declaredRecords: snapshot.records.length, availableRecords: snapshot.records.filter((record) => record.available).length }));
    } catch {
      console.error('Snapshot preparation failed. Check the local source commit, mapped public files, declared revisions and unused output destination. No source was fetched.');
      process.exitCode = 1;
    }
  }
}
