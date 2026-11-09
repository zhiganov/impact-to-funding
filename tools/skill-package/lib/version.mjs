const numeric = '(?:0|[1-9][0-9]*)';
const identifier = '[0-9A-Za-z-]+';
const pattern = new RegExp(`^(${numeric})\\.(${numeric})\\.(${numeric})(?:-(${identifier}(?:\\.${identifier})*))?(?:\\+(${identifier}(?:\\.${identifier})*))?$`);

export function parseVersion(value) {
  if (typeof value !== 'string') throw new TypeError('Version must be a SemVer string');
  const match = value.match(pattern);
  if (!match) throw new TypeError('Invalid SemVer version');
  const prerelease = match[4]?.split('.') ?? [];
  if (prerelease.some((part) => /^[0-9]+$/.test(part) && part.length > 1 && part.startsWith('0'))) {
    throw new TypeError('Numeric prerelease identifiers cannot have leading zeros');
  }
  return { version: value, core: match.slice(1, 4), prerelease, build: match[5] ?? null };
}

function compareInteger(a, b) {
  return Math.sign(a.length - b.length) || (a === b ? 0 : a < b ? -1 : 1);
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let i = 0; i < 3; i += 1) {
    const order = compareInteger(a.core[i], b.core[i]);
    if (order) return order;
  }
  if (!a.prerelease.length || !b.prerelease.length) {
    return a.prerelease.length ? -1 : b.prerelease.length ? 1 : 0;
  }
  for (let i = 0; i < Math.max(a.prerelease.length, b.prerelease.length); i += 1) {
    const x = a.prerelease[i];
    const y = b.prerelease[i];
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
    if (x === y) continue;
    const xn = /^[0-9]+$/.test(x);
    const yn = /^[0-9]+$/.test(y);
    if (xn && yn) return compareInteger(x, y);
    if (xn !== yn) return xn ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}
