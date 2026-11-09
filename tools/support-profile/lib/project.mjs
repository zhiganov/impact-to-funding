import { analyse, checkFinancial, CARRIER } from './inspect.mjs';
import { parseStrict, isPublicUrlSyntax } from './parse.mjs';

const own = (value, key) => Object.hasOwn(value, key);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value) => typeof value === 'string' && value.trim().length > 0;

function blocked(inspection, code, path = '') {
  return {
    status: 'blocked',
    ...(inspection ? { inspection } : {}),
    issues: [{ code, path, level: 'invalid' }],
  };
}

function stableUrl(value) {
  return isPublicUrlSyntax(value, { allowFragment: false }) && !new URL(value).search;
}

function notes(operation, sourceUrl, sourceRevision) {
  return {
    operation,
    source: { url: sourceUrl, revision: sourceRevision },
    sourceBasis: 'Supplied local content and declared locator/version; not fetched or authenticated.',
    losses: [],
    warnings: [
      'Local candidate only; disclosure, processing authority and destination approval were not assessed.',
      'No impact, independent review, eligibility, award or payment authority is established.',
      'No consumer import, directory acceptance, source retrieval or public publication was performed.',
      'Whitespace and number spelling may differ; preserved JSON values are not byte-identical source history.',
    ],
    checks: { privacy: 'not_assessed', authority: 'not_assessed', consumerCompatibility: 'not_tested' },
  };
}

export function financialView(input, options = {}) {
  options = object(options) ? options : {};
  const analysis = analyse(input, options);
  if (analysis.report.status !== 'valid') return blocked(analysis.report, 'support_interpretation_not_valid');
  if (analysis.carrier !== 'embedded') return blocked(analysis.report, 'embedded_carrier_required');
  const sourceUrl = options.sourceUrl ?? analysis.payload.canonicalUrl;
  if (!stableUrl(sourceUrl)) return blocked(analysis.report, 'stable_source_url_required');
  const base = checkFinancial(analysis.document);
  if (base.status !== 'valid') return blocked(analysis.report, 'financial_base_not_valid');
  if (!text(analysis.document.version)) return blocked(analysis.report, 'financial_content_version_required');

  const document = structuredClone(analysis.document);
  delete document.extensions[CARRIER];
  if (Object.keys(document.extensions).length === 0) delete document.extensions;
  const projectionNotes = notes('remove_itf_carrier', sourceUrl, analysis.document.version);
  projectionNotes.supportRevision = analysis.payload.revision;
  projectionNotes.losses = [
    'The entire ItF support payload is removed, including cases, non-money needs, report relationships and correction context.',
    'The support payload cannot be reconstructed from this financial view; this is not a lossless round trip.',
  ];
  projectionNotes.financialContentVersion = 'Retained as the financial source basis, not proof of byte-identical complete-manifest history.';
  projectionNotes.unrelatedData = 'All other input values/properties are preserved. Unrelated extensions are not made supported by this operation.';
  return { status: 'ok', inspection: analysis.report, document, notes: projectionNotes };
}

export function bind(input, fundingInput, mappingInput, options = {}) {
  options = object(options) ? options : {};
  const analysis = analyse(input, {
    sourceUrl: options.sourceUrl,
    fundingText: fundingInput,
    fundingSourceUrl: options.destinationUrl,
  });
  if (analysis.report.status !== 'valid') return blocked(analysis.report, 'support_interpretation_not_valid');
  if (analysis.carrier !== 'standalone') return blocked(analysis.report, 'standalone_source_required');
  const financialParsed = parseStrict(fundingInput);
  if (!financialParsed.ok) return blocked(analysis.report, 'financial_input_not_readable');
  const mappingParsed = parseStrict(mappingInput);
  if (!mappingParsed.ok) return blocked(analysis.report, 'mapping_input_not_readable');
  const financial = financialParsed.value;
  const mapping = mappingParsed.value;
  if (!object(financial) || checkFinancial(financial).status !== 'valid') {
    return blocked(analysis.report, 'financial_base_not_valid');
  }
  if (!text(financial.version)) return blocked(analysis.report, 'financial_content_version_required');
  if (own(financial, 'extensions') && !object(financial.extensions)) {
    return blocked(analysis.report, 'invalid_extension_container');
  }
  if (object(financial.extensions) && own(financial.extensions, CARRIER)) {
    return blocked(analysis.report, 'existing_support_carrier');
  }
  if (!object(mapping)) return blocked(analysis.report, 'mapping_object_required');
  const sourceUrl = options.sourceUrl ?? analysis.payload.canonicalUrl;
  if (!stableUrl(sourceUrl) || !stableUrl(options.destinationUrl)) {
    return blocked(analysis.report, 'stable_source_and_destination_urls_required');
  }
  if (options.sourceUrl && analysis.payload.canonicalUrl && options.sourceUrl !== analysis.payload.canonicalUrl) {
    return blocked(analysis.report, 'source_context_conflict');
  }
  if (sourceUrl === options.destinationUrl) return blocked(analysis.report, 'distinct_destination_required');
  if (!text(options.revision) || options.revision === analysis.payload.revision || !text(options.mappingRevision)) {
    return blocked(analysis.report, 'new_content_and_mapping_revisions_required');
  }

  const cases = analysis.payload.supportCases ?? [];
  const monetaryCases = new Map(cases.filter((entry) => own(entry, 'money')).map((entry) => [entry.id, entry]));
  const mapped = Object.keys(mapping);
  if (mapped.length !== monetaryCases.size || mapped.some((id) => !monetaryCases.has(id))) {
    return blocked(analysis.report, 'mapping_must_cover_exact_monetary_cases', '/mapping');
  }
  const plans = new Map(financial.funding.plans.map((plan) => [plan.guid, plan]));
  for (const entry of cases) {
    if (own(entry, 'fundingPlanRef')) {
      const reference = entry.fundingPlanRef;
      if (reference.url !== options.destinationUrl || reference.version !== financial.version || !plans.has(reference.guid)) {
        return blocked(analysis.report, 'existing_financial_reference_cannot_be_rebound');
      }
    }
  }
  for (const [id, entry] of monetaryCases) {
    if (!own(entry.money, 'amount') || !own(entry.money, 'currency')) {
      return blocked(analysis.report, 'source_monetary_amount_not_known', '/supportCases');
    }
    const planId = mapping[id];
    if (typeof planId !== 'string' || !plans.has(planId)) {
      return blocked(analysis.report, 'mapped_plan_not_available', '/mapping');
    }
    for (const field of ['amount', 'currency', 'frequency', 'status']) {
      if (own(entry.money, field) && entry.money[field] !== plans.get(planId)[field]) {
        return blocked(analysis.report, 'monetary_terms_conflict', '/supportCases');
      }
    }
  }

  const payload = structuredClone(analysis.payload);
  payload.revision = options.revision;
  payload.canonicalUrl = options.destinationUrl;
  payload.derivedFrom = { url: sourceUrl, revision: analysis.payload.revision, mappingRevision: options.mappingRevision };
  for (const entry of payload.supportCases ?? []) {
    if (!own(entry, 'money')) continue;
    const money = entry.money;
    entry.limitations += ` Monetary source basis: ${money.costBasis} Existing support: ${money.existingSupport}`;
    entry.fundingPlanRef = { url: options.destinationUrl, version: financial.version, guid: mapping[entry.id] };
    delete entry.money;
  }
  const document = structuredClone(financial);
  if (!own(document, 'extensions')) document.extensions = {};
  document.extensions[CARRIER] = payload;
  const resulting = analyse(JSON.stringify(document), { sourceUrl: options.destinationUrl });
  if (resulting.report.status !== 'valid') return blocked(resulting.report, 'derived_document_not_valid');
  const projectionNotes = notes('bind_explicit_financial_plans', sourceUrl, analysis.payload.revision);
  projectionNotes.mappingRevision = options.mappingRevision;
  projectionNotes.destination = { url: options.destinationUrl, financialVersion: financial.version, supportRevision: payload.revision };
  projectionNotes.mappings = Object.entries(mapping).map(([caseId, planGuid]) => ({ caseId, planGuid }));
  projectionNotes.financialValues = 'Existing supplied financial values/statuses are unchanged; no cost allocation, currency conversion or funding commitment is inferred.';
  projectionNotes.losses = ['The original money object is replaced by a financial-plan reference; its basis and existing-support caveats are retained in case limitations.'];
  return { status: 'ok', inspection: resulting.report, document, notes: projectionNotes };
}
