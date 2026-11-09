// Original ItF tooling. MIT licensed; see the repository LICENSE.
import {readFileSync} from 'node:fs';
import Ajv from 'ajv';
import {parseStrict, isPublicUrlSyntax} from './parse.mjs';

export const PROFILE = 'itf.support/0.1-proposal';
export const CARRIER = 'org.impact-to-funding.support';

// Only these two trusted bundled schemas are compiled. Input $schema values
// are declarations, never instructions to load or execute another schema.
const supportSchema = JSON.parse(readFileSync(new URL('../schema.json', import.meta.url), 'utf8'));
const fundingSchema = JSON.parse(readFileSync(new URL('../vendor/funding-v1.1.0.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv({allErrors: true, strict: false, strictNumbers: true, ownProperties: true, coerceTypes: false, useDefaults: false, removeAdditional: false});
const validateSupport = ajv.compile(supportSchema);
const validateFunding = ajv.compile(fundingSchema);
const currencies = new Set(Intl.supportedValuesOf('currency'));
const own = (object, key) => object !== null && typeof object === 'object' && Object.hasOwn(object, key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && /\S/u.test(value);
const issue = (issues, code, path, level = 'invalid') => issues.push({code, path, level});
const statusOf = issues => issues.some(item => item.level === 'invalid') ? 'invalid' : issues.length ? 'limited' : 'valid';
const uniqueIssues = issues => [...new Map(issues.map(item => [JSON.stringify(item), item])).values()];
const escape = key => key.replace(/~/g, '~0').replace(/\//g, '~1');
const embeddedPath = `/extensions/${CARRIER}`;

function dereference(schema, root) {
  if (!schema?.$ref) return schema;
  // All references are from the trusted local support schema, not input data.
  return schema.$ref.slice(2).split('/').reduce((value, key) => value?.[key], root);
}

// Resolve every segment against its actual schema context. A global field-name
// allowlist would leak unknown keys that happen to equal another field's name.
function safePath(path, root) {
  let schema = root;
  let result = '';
  for (const encoded of path.split('/').slice(1)) {
    const key = encoded.replace(/~1/g, '/').replace(/~0/g, '~');
    schema = dereference(schema, root);
    if (schema?.type === 'array' && /^(0|[1-9]\d*)$/.test(key)) {
      result += `/${key}`;
      schema = schema.items;
    } else if (schema?.properties && Object.hasOwn(schema.properties, key)) {
      result += `/${escape(key)}`;
      schema = schema.properties[key];
    } else {
      result += '/[unknown]';
      schema = null;
    }
  }
  return result;
}

function schemaIssues(errors, schema, prefix, code) {
  return (errors ?? []).map(error => {
    let path = error.instancePath;
    // Do not return Ajv messages, schema paths or parameters. Even the missing
    // property name is resolved through the trusted schema before displaying it.
    if (error.keyword === 'required') path += `/${escape(error.params.missingProperty)}`;
    return {code, path: prefix + safePath(path, schema), level: 'invalid'};
  });
}

function currencyIssue(value, path, issues) {
  if (typeof value === 'string') {
    if (!/^[A-Z]{3}(?![\s\S])/.test(value)) issue(issues, 'currency_syntax_invalid', path);
    else if (!currencies.has(value)) issue(issues, 'currency_not_supported', path, 'limited');
  }
}

function duplicates(list, path, field, issues, code) {
  const seen = new Set();
  for (const [index, item] of list.entries()) {
    if (!object(item) || typeof item[field] !== 'string') continue;
    if (seen.has(item[field])) issue(issues, code, `${path}/${index}/${field}`);
    seen.add(item[field]);
  }
}

function assessFinancial(manifest) {
  const passed = validateFunding(manifest);
  const issues = schemaIssues(validateFunding.errors, fundingSchema, '', 'financial_schema_invalid');
  // A supplied hint is only a declaration. The local binding is v1.1.0; do not
  // imply support for another declaration or fetch/compile its referenced URL.
  if (own(manifest, '$schema') && manifest.$schema !== 'https://fundingjson.org/schema/v1.1.0.json' && manifest.$schema !== 'https://fundingjson.org/schema/v1.1.0.json#') {
    issue(issues, 'financial_schema_declaration_not_supported', '/$schema', 'limited');
  }
  // Extra native fields are deliberately not interpreted or rejected as ItF
  // properties. These checks address meaning that the upstream schema permits
  // but which cannot honestly be used as a complete financial plan.
  function meaningful(value, schema, path = '', required = false) {
    if (required && schema?.type === 'string' && typeof value === 'string' && !text(value)) issue(issues, 'financial_empty_text', path);
    if (object(value) && schema?.properties) {
      for (const [key, child] of Object.entries(schema.properties)) {
        if (own(value, key)) meaningful(value[key], child, `${path}/${key}`, schema.required?.includes(key) ?? false);
      }
    } else if (Array.isArray(value) && schema?.items) {
      value.forEach((item, index) => meaningful(item, schema.items, `${path}/${index}`));
    }
  }
  meaningful(manifest, fundingSchema);
  function guid(value, path) {
    if (typeof value === 'string' && !/^[a-z0-9-]{1,32}(?![\s\S])/.test(value)) issue(issues, 'financial_guid_invalid', path);
  }
  const funding = object(manifest) && object(manifest.funding) ? manifest.funding : null;
  if (funding) {
    for (const key of ['channels', 'plans']) {
      if (Array.isArray(funding[key]) && funding[key].length === 0) issue(issues, 'financial_empty_list', `/funding/${key}`);
    }
    const channels = Array.isArray(funding.channels) ? funding.channels : [];
    const plans = Array.isArray(funding.plans) ? funding.plans : [];
    duplicates(channels, '/funding/channels', 'guid', issues, 'financial_duplicate_guid');
    duplicates(plans, '/funding/plans', 'guid', issues, 'financial_duplicate_guid');
    channels.forEach((channel, index) => {
      if (object(channel)) guid(channel.guid, `/funding/channels/${index}/guid`);
    });
    const channelCounts = new Map();
    for (const channel of channels) {
      if (object(channel) && typeof channel.guid === 'string') channelCounts.set(channel.guid, (channelCounts.get(channel.guid) ?? 0) + 1);
    }
    plans.forEach((plan, index) => {
      if (!object(plan)) return;
      const path = `/funding/plans/${index}`;
      guid(plan.guid, `${path}/guid`);
      if (typeof plan.amount === 'number' && (!Number.isFinite(plan.amount) || plan.amount < 0 || Object.is(plan.amount, -0))) issue(issues, 'financial_amount_invalid', `${path}/amount`);
      currencyIssue(plan.currency, `${path}/currency`, issues);
      if (Array.isArray(plan.channels)) {
        if (!plan.channels.length) issue(issues, 'financial_empty_list', `${path}/channels`);
        const seen = new Set();
        plan.channels.forEach((guid, channelIndex) => {
          const refPath = `${path}/channels/${channelIndex}`;
          if (typeof guid !== 'string') return;
          if (!/^[a-z0-9-]{1,32}(?![\s\S])/.test(guid)) issue(issues, 'financial_guid_invalid', refPath);
          if (channelCounts.get(guid) !== 1) issue(issues, 'financial_channel_unresolved', refPath);
          if (seen.has(guid)) issue(issues, 'financial_duplicate_channel_ref', refPath);
          seen.add(guid);
        });
      }
    });
    if (Array.isArray(funding.history)) funding.history.forEach((entry, index) => {
      if (!object(entry)) return;
      currencyIssue(entry.currency, `/funding/history/${index}/currency`, issues);
      // Historical credits/corrections are not asks. Preserve their native sign;
      // strictNumbers above still rejects non-finite supplied numeric values.
      if (!own(entry, 'income') && !own(entry, 'expenses')) issue(issues, 'financial_history_values_missing', `/funding/history/${index}`, 'limited');
    });
  }
  if (object(manifest) && Array.isArray(manifest.projects)) {
    duplicates(manifest.projects, '/projects', 'guid', issues, 'financial_duplicate_guid');
    manifest.projects.forEach((project, index) => {
      if (object(project)) guid(project.guid, `/projects/${index}/guid`);
      if (object(project) && Array.isArray(project.licenses)) {
        if (!project.licenses.length) issue(issues, 'financial_empty_list', `/projects/${index}/licenses`);
        project.licenses.forEach((license, licenseIndex) => {
          if (typeof license === 'string' && !text(license)) issue(issues, 'financial_license_empty', `/projects/${index}/licenses/${licenseIndex}`);
        });
      }
    });
  }
  return {status: statusOf(issues), schemaValid: passed, issues: uniqueIssues(issues)};
}

export function checkFinancial(manifest) {
  return assessFinancial(manifest);
}

function checkUrl(value, path, issues, allowFragment = true) {
  if (typeof value !== 'string') return; // The schema handles wrong types.
  if (!isPublicUrlSyntax(value, {allowFragment})) issue(issues, 'public_url_invalid', path);
  else if (value.includes('?') && value.indexOf('?') < (value.indexOf('#') < 0 ? Infinity : value.indexOf('#'))) {
    issue(issues, 'url_query_not_supported', path, 'limited');
  }
}

function supportExtras(value, schema, path, issues) {
  schema = dereference(schema, supportSchema);
  if (object(value) && schema?.properties) {
    for (const key of Object.keys(value)) {
      if (Object.hasOwn(schema.properties, key)) supportExtras(value[key], schema.properties[key], `${path}/${key}`, issues);
      else issue(issues, 'unknown_support_property', `${path}/[unknown]`, 'limited');
    }
  } else if (Array.isArray(value) && schema?.items) {
    value.forEach((item, index) => supportExtras(item, schema.items, `${path}/${index}`, issues));
  }
}

function supportSemantics(payload, prefix, carrier, issues, reportReferences) {
  if (!object(payload)) return;
  supportExtras(payload, supportSchema, prefix, issues);
  if (own(payload, 'canonicalUrl')) checkUrl(payload.canonicalUrl, `${prefix}/canonicalUrl`, issues, false);
  if (own(payload, 'statusUrl')) checkUrl(payload.statusUrl, `${prefix}/statusUrl`, issues);
  if (object(payload.publisher) && own(payload.publisher, 'webpageUrl')) checkUrl(payload.publisher.webpageUrl, `${prefix}/publisher/webpageUrl`, issues);
  if (object(payload.derivedFrom) && own(payload.derivedFrom, 'url')) checkUrl(payload.derivedFrom.url, `${prefix}/derivedFrom/url`, issues);
  const reports = Array.isArray(payload.reports) ? payload.reports : [];
  const cases = Array.isArray(payload.supportCases) ? payload.supportCases : [];
  duplicates(reports, `${prefix}/reports`, 'id', issues, 'duplicate_report_id');
  duplicates(cases, `${prefix}/supportCases`, 'id', issues, 'duplicate_case_id');
  const reportIds = new Set(reports.filter(object).map(report => report.id));
  reports.forEach((report, index) => {
    if (!object(report)) return;
    const path = `${prefix}/reports/${index}`;
    if (own(report, 'url')) {
      checkUrl(report.url, `${path}/url`, issues);
      reportReferences.push({path: `${path}/url`, inspection: 'not_inspected'});
    }
    if (!own(report, 'revision')) issue(issues, 'report_version_unknown', `${path}/revision`, 'limited');
  });
  cases.forEach((supportCase, index) => {
    if (!object(supportCase)) return;
    const path = `${prefix}/supportCases/${index}`;
    if (carrier === 'embedded' && own(supportCase, 'money')) issue(issues, 'embedded_money_not_allowed', `${path}/money`);
    if (object(supportCase.money)) currencyIssue(supportCase.money.currency, `${path}/money/currency`, issues);
    if (object(supportCase.fundingPlanRef)) checkUrl(supportCase.fundingPlanRef.url, `${path}/fundingPlanRef/url`, issues, false);
    if (Array.isArray(supportCase.reportRefs)) supportCase.reportRefs.forEach((id, refIndex) => {
      if (typeof id === 'string' && !reportIds.has(id)) issue(issues, 'report_ref_unresolved', `${path}/reportRefs/${refIndex}`);
    });
  });
}

function sameUrl(left, right) {
  if (!isPublicUrlSyntax(left, {allowFragment: false}) || !isPublicUrlSyntax(right, {allowFragment: false})) return false;
  return new URL(left).href === new URL(right).href;
}

function references(payload, prefix, base, baseSourceUrl, financial, issues) {
  if (!object(payload) || !Array.isArray(payload.supportCases)) return;
  payload.supportCases.forEach((supportCase, index) => {
    if (!object(supportCase) || !object(supportCase.fundingPlanRef)) return;
    const ref = supportCase.fundingPlanRef;
    const path = `${prefix}/supportCases/${index}/fundingPlanRef`;
    if (!own(ref, 'version')) issue(issues, 'funding_version_unknown', `${path}/version`, 'limited');
    if (!object(base) || !baseSourceUrl) {
      issue(issues, 'funding_reference_unresolved', path, 'limited');
      return;
    }
    if (!sameUrl(ref.url, baseSourceUrl)) {
      issue(issues, 'funding_source_conflict', `${path}/url`, 'limited');
      return;
    }
    if (!text(base.version)) issue(issues, 'funding_base_version_unknown', `${path}/version`, 'limited');
    else if (own(ref, 'version') && ref.version !== base.version) issue(issues, 'funding_version_conflict', `${path}/version`, 'limited');
    const plans = object(base.funding) && Array.isArray(base.funding.plans) ? base.funding.plans : [];
    const matches = plans.filter(plan => object(plan) && plan.guid === ref.guid);
    if (typeof ref.guid !== 'string' || matches.length !== 1) issue(issues, matches.length > 1 ? 'funding_plan_conflict' : 'funding_plan_unresolved', `${path}/guid`, 'limited');
    if (financial?.status !== 'valid') issue(issues, 'funding_terms_not_supported', path, 'limited');
  });
}

export function analyse(input, options = {}) {
  const report = {
    status: 'valid', carrier: null, issues: [],
    checks: {privacy: 'not_assessed', authority: 'not_assessed', impact: 'not_assessed', network: 'disabled', fundingSchema: 'not_applicable', fundingMeaning: 'not_applicable'},
    financialIssues: [],
    reportReferences: []
  };
  let document = null;
  let payload = null;
  let carrier = null;
  let financial = null;
  const sourceUrl = options.sourceUrl ?? null;
  const result = () => {
    if (financial) {
      report.checks.fundingMeaning = financial.status;
      report.financialIssues = financial.issues;
    }
    return {report, document, payload, carrier, sourceUrl, financial};
  };
  const parsed = parseStrict(input);
  if (!parsed.ok) {
    report.status = parsed.status;
    report.issues = parsed.issues;
    report.checks.fundingMeaning = 'not_checked';
    return result();
  }
  document = parsed.value;
  const standalone = object(document) && own(document, 'profile');
  const embedded = object(document) && object(document.extensions) && own(document.extensions, CARRIER);
  let base = null;
  let baseSourceUrl = null;
  if (embedded) {
    base = document;
    financial = assessFinancial(base);
    report.checks.fundingSchema = financial.schemaValid ? 'passed' : 'failed';
  }
  if (standalone && embedded) {
    report.status = 'limited';
    issue(report.issues, 'conflicting_support_carriers', '', 'limited');
    return result();
  }
  if (!standalone && !embedded) {
    report.status = 'unsupported';
    issue(report.issues, 'support_carrier_not_found', '', 'unsupported');
    return result();
  }
  carrier = report.carrier = standalone ? 'standalone' : 'embedded';
  payload = standalone ? document : document.extensions[CARRIER];
  const prefix = standalone ? '' : embeddedPath;
  if (object(payload) && typeof payload.profile === 'string' && payload.profile !== PROFILE) {
    report.status = 'unsupported';
    issue(report.issues, 'profile_not_supported', `${prefix}/profile`, 'unsupported');
    return result();
  }
  validateSupport(payload);
  report.issues.push(...schemaIssues(validateSupport.errors, supportSchema, prefix, 'support_schema_invalid'));
  supportSemantics(payload, prefix, carrier, report.issues, report.reportReferences);
  if (carrier === 'embedded') {
    const canonical = object(payload) ? payload.canonicalUrl : null;
    baseSourceUrl = options.sourceUrl ?? canonical ?? null;
    if (options.sourceUrl != null) checkUrl(options.sourceUrl, '', report.issues, false);
    if (options.sourceUrl != null && canonical != null && !sameUrl(options.sourceUrl, canonical)) issue(report.issues, 'canonical_source_conflict', `${prefix}/canonicalUrl`, 'limited');
  } else if (options.fundingText !== undefined) {
    const fundingParsed = parseStrict(options.fundingText);
    if (fundingParsed.ok) {
      base = fundingParsed.value;
      financial = assessFinancial(base);
      report.checks.fundingSchema = financial.schemaValid ? 'passed' : 'failed';
    } else {
      financial = {status: fundingParsed.status, schemaValid: false, issues: fundingParsed.issues};
      report.checks.fundingSchema = 'not_checked';
    }
    baseSourceUrl = options.fundingSourceUrl ?? null;
    if (baseSourceUrl != null) checkUrl(baseSourceUrl, '', report.issues, false);
  } else if (object(payload) && Array.isArray(payload.supportCases) && payload.supportCases.some(item => object(item) && own(item, 'fundingPlanRef'))) {
    report.checks.fundingSchema = 'not_checked';
    report.checks.fundingMeaning = 'not_checked';
  }
  references(payload, prefix, base, baseSourceUrl, financial, report.issues);
  report.issues = uniqueIssues(report.issues);
  report.status = statusOf(report.issues);
  return result();
}

export function inspect(input, options) {
  return analyse(input, options).report;
}
