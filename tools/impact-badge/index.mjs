// Build an impact report badge and cards from a support profile and a badge input file.
// See docs/impact-badge-contract.md. Runs locally; no network.

export const PROVENANCE = ['self-report', 'ai-assisted', 'peer-review', 'independent-evaluation'];
export const SUPPORT = ['supported', 'partly-supported', 'insufficient', 'conflicting', 'not-assessed'];
export const STATES = ['current', 'corrected', 'out-of-date', 'withdrawn'];

export const PROVENANCE_LABELS = {
  'self-report': 'self-reported',
  'ai-assisted': 'AI-assisted',
  'peer-review': 'peer-reviewed',
  'independent-evaluation': 'independently evaluated',
};

const FONT = 'Verdana,DejaVu Sans,sans-serif';
const MAX_CLAIMS = 3;
const MAX_CLAIM_CHARS = 60;
const MAX_NOTE_CHARS = 80;
const STALE_MONTHS = 12;

const COLOURS = {
  badge: { label: '#4a4a4a', active: '#2f5f8f', inactive: '#6b7280' },
  light: { bg: '#ffffff', text: '#1f2937', title: '#111827', muted: '#6b7280', sub: '#374151', active: '#2f5f8f', inactive: '#6b7280', bannerText: '#ffffff' },
  dark: { bg: '#161b22', text: '#e6edf3', title: '#f0f6fc', muted: '#8b949e', sub: '#c9d1d9', active: '#58a6ff', inactive: '#8b949e', bannerText: '#0d1117' },
};

export function supportLabel(value) {
  return value.replace(/-/g, ' ');
}

function escapeXml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
}

function isText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Check both inputs against the contract. Returns { errors, warnings, data }. */
export function validate(manifest, input, { now = new Date() } = {}) {
  const errors = [];
  const warnings = [];
  if (!manifest || typeof manifest !== 'object') errors.push('Manifest must be a JSON object.');
  if (!input || typeof input !== 'object') errors.push('Badge input must be a JSON object.');
  if (errors.length) return { errors, warnings };

  const subjectName = manifest.subject?.name;
  if (!isText(subjectName)) errors.push('Manifest needs subject.name.');
  const reports = Array.isArray(manifest.reports) ? manifest.reports : [];
  const report = reports.find((item) => item?.id === input.reportId);
  if (!isText(input.reportId)) errors.push('Badge input needs reportId.');
  else if (!report) errors.push(`No report with id "${input.reportId}" in the manifest.`);
  else if (!isText(report.url)) errors.push(`Report "${input.reportId}" has no url.`);

  if (!PROVENANCE.includes(input.provenance)) errors.push(`provenance must be one of: ${PROVENANCE.join(', ')}.`);
  if (!STATES.includes(input.state)) errors.push(`state must be one of: ${STATES.join(', ')}.`);
  if (input.stateNote !== undefined && (!isText(input.stateNote) || input.stateNote.length > MAX_NOTE_CHARS)) {
    errors.push(`stateNote must be text of at most ${MAX_NOTE_CHARS} characters.`);
  }

  const claims = input.claims ?? [];
  if (!Array.isArray(claims)) errors.push('claims must be an array.');
  else {
    if (claims.length > MAX_CLAIMS) errors.push(`At most ${MAX_CLAIMS} claims.`);
    claims.forEach((claim, index) => {
      const at = `claims[${index}]`;
      if (!isText(claim?.text)) errors.push(`${at} needs text.`);
      else if (claim.text.length > MAX_CLAIM_CHARS) errors.push(`${at}.text is over ${MAX_CLAIM_CHARS} characters.`);
      if (!SUPPORT.includes(claim?.support)) errors.push(`${at}.support must be one of: ${SUPPORT.join(', ')}.`);
      if (claim?.support === 'not-assessed') {
        if (claim.provenance !== undefined) errors.push(`${at} is not assessed, so it can't have a provenance.`);
      } else if (!PROVENANCE.includes(claim?.provenance)) {
        errors.push(`${at}.provenance must be one of: ${PROVENANCE.join(', ')}.`);
      } else if (PROVENANCE.includes(input.provenance)
        && PROVENANCE.indexOf(claim.provenance) < PROVENANCE.indexOf(input.provenance)) {
        errors.push(`${at} is ${claim.provenance}, weaker than the badge's ${input.provenance}. The badge must not claim more than its weakest shown claim.`);
      }
    });
  }

  if (report && input.state === 'current' && isText(report.published)) {
    const published = new Date(report.published);
    if (!Number.isNaN(published.getTime())) {
      const months = (now.getFullYear() - published.getFullYear()) * 12 + (now.getMonth() - published.getMonth());
      if (months > STALE_MONTHS) warnings.push(`The report was published ${months} months ago. Consider state "out-of-date".`);
    }
  }

  return {
    errors,
    warnings,
    data: errors.length ? undefined : {
      subjectName,
      report,
      provenance: input.provenance,
      state: input.state,
      stateNote: input.stateNote,
      statusUrl: manifest.statusUrl,
      claims,
    },
  };
}

function when(report) {
  return report.period ?? report.published ?? 'undated';
}

export function badgeJson(data) {
  const parts = [when(data.report)];
  if (data.state === 'withdrawn') parts.push('withdrawn');
  else if (data.state === 'out-of-date') parts.push('out of date');
  else {
    if (data.state === 'corrected') parts.push('corrected');
    parts.push(PROVENANCE_LABELS[data.provenance]);
  }
  const active = data.state === 'current' || data.state === 'corrected';
  return {
    schemaVersion: 1,
    label: 'impact report',
    message: parts.join(' · '),
    color: active ? COLOURS.badge.active : COLOURS.badge.inactive,
  };
}

function shortUrl(url, max) {
  const bare = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return bare.length > max ? `${bare.slice(0, max - 1)}…` : bare;
}

function bannerText(data) {
  if (data.state !== 'withdrawn' && data.state !== 'out-of-date') return undefined;
  const base = data.state === 'withdrawn' ? 'Withdrawn' : 'May be out of date';
  if (data.stateNote) return `${base}: ${data.stateNote}`;
  if (data.statusUrl) return `${base}: see ${shortUrl(data.statusUrl, 50)}`;
  return base;
}

export function cardSvg(data, theme = 'light') {
  const t = COLOURS[theme];
  if (!t || theme === 'badge') throw new Error(`Unknown theme: ${theme}`);
  const active = data.state === 'current' || data.state === 'corrected';
  const colour = active ? t.active : t.inactive;
  const banner = bannerText(data);
  const width = 520;
  const top = banner ? 28 : 0;
  const step = 36;
  const height = 96 + top + step * data.claims.length + 28;
  const heading = [`Impact report · ${when(data.report)}`];
  if (data.report.published) heading.push(`published ${data.report.published}`);
  if (data.state === 'corrected') heading.push('corrected');

  const alt = [`${data.subjectName}. ${heading.join(', ')}.`];
  if (banner) alt.push(`${banner}.`);
  let rows = '';
  data.claims.forEach((claim, index) => {
    const y = 92 + top + index * step;
    const tag = [supportLabel(claim.support), claim.provenance && PROVENANCE_LABELS[claim.provenance]].filter(Boolean).join(' · ');
    alt.push(`${claim.text}: ${tag}.`);
    rows += `<text x="20" y="${y}" font-size="13" fill="${t.text}">${escapeXml(claim.text)}</text>`
      + `<text x="20" y="${y + 16}" font-size="11" fill="${colour}">${escapeXml(tag)}</text>`;
  });
  if (!data.claims.length) alt.push(`Review basis: ${PROVENANCE_LABELS[data.provenance]}.`);
  alt.push(`Self-declared by the publisher. Full report: ${data.report.url}`);
  const label = escapeXml(alt.join(' '));
  const bannerSvg = banner
    ? `<path d="M1 9a8 8 0 0 1 8-8h${width - 18}a8 8 0 0 1 8 8v19H1z" fill="${t.inactive}"/>`
      + `<text x="20" y="19" font-size="12" font-weight="bold" fill="${t.bannerText}">${escapeXml(banner)}</text>`
    : '';
  const basis = data.claims.length ? '' : `<text x="20" y="${92 + top}" font-size="12" fill="${colour}">${escapeXml(PROVENANCE_LABELS[data.provenance])}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" font-family="${FONT}" role="img" aria-label="${label}"><title>${label}</title>`
    + `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="8" fill="${t.bg}" stroke="${colour}" stroke-width="2"/>${bannerSvg}`
    + '<g>'
    + `<text x="20" y="${36 + top}" font-size="15" font-weight="bold" fill="${t.title}">${escapeXml(data.subjectName)}</text>`
    + `<text x="20" y="${56 + top}" font-size="12" fill="${t.sub}">${escapeXml(heading.join(' · '))}</text>${rows}${basis}`
    + `<text x="20" y="${height - 16}" font-size="10" fill="${t.muted}">Self-declared by the publisher. Full report: ${escapeXml(shortUrl(data.report.url, 50))}</text>`
    + '</g></svg>\n';
}

/** Validate and build every output. Throws with all errors if the inputs don't fit the contract. */
export function build(manifest, input, options) {
  const result = validate(manifest, input, options);
  if (result.errors.length) {
    const error = new Error(result.errors.join('\n'));
    error.errors = result.errors;
    throw error;
  }
  return {
    warnings: result.warnings,
    files: {
      'itf-badge.json': `${JSON.stringify(badgeJson(result.data), null, 2)}\n`,
      'itf-card-light.svg': cardSvg(result.data, 'light'),
      'itf-card-dark.svg': cardSvg(result.data, 'dark'),
    },
  };
}
