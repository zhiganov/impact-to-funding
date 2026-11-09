# Local support-profile implementation checks

**Date:** 2026-11-09. **Scope:** optional source implementation for
[#49](https://github.com/zhiganov/impact-to-funding/issues/49), based on
`beb0fb8fa77664ff78de3475e58d897547d4c234`. This records local checks, not a
consumer integration, model trial, installation test or real support-record export.

The [tools](../tools/support-profile/README.md) implement the adopted
[`itf.support/0.1-proposal` contract](support-profile-contract.md). Ordinary skill
use needs none of their dependencies. The [usage guide](support-profile-tools.md)
describes input, disclosure and projection boundaries.

## Actual environment and commands

- Node.js **22.18.0**, npm **11.13.0**, ICU **77.1**, macOS arm64.
- Optional dependencies: **Ajv 8.17.1** and **jsonc-parser 3.3.1**, installed with
  lifecycle scripts and audit disabled. Dependency setup uses the registry;
  runtime operations do not fetch sources, reports or schemas.
- From `tools/support-profile`: `npm test` — **44/44 passed**, no skips.
- From the repository root: `node --test tests/package.test.mjs` — **4/4 passed**.
- `git diff --check` and task-file text/link checks passed.

Tests read the two authored fictional examples, mutate copies for failure cases
and use owned temporary directories. Eight CLI tests launch the real command with
network tripwires. They do not launch an upstream consumer, funding service or
model. Temporary CLI resources were removed; the owned test directory was empty
after the final run. No server or watcher was started.

## Observed coverage

- General non-software/prospective support remains valid without invented OSS,
  payment, contact or past-evidence facts. Missing amounts are not zero; explicit
  zero remains any amount.
- Strict JSON rejects comments, trailing commas and duplicate keys. Byte/depth
  limits and unsafe numeric round trips produce explicit limitations. Unknown
  profile versions and unknown support properties are not silently interpreted.
- Diagnostics redact values and unknown property names. Report links are declared
  references, not retrieved evidence or independent review.
- Financial schema results remain distinct from financial meaning. Negative asks,
  unresolved references and blank required licence entries block projections;
  permitted empty optional metadata and historical credits/corrections survive.
- Binding requires explicit mappings and matching supplied monetary terms. It
  retains source qualifications and versioned derivation without changing native
  financial values or multiplying shared plans into additional asks.
- Financial views remove the exact ItF carrier and preserve other JSON values,
  unrelated extensions and financial content versions. Notes state the lost
  support context and the absence of a lossless round trip or consumer proof.
- CLI projections create new private bundles, preserve inputs and existing output
  directories, and refuse limited/invalid inputs before writing. A POSIX FIFO
  without a writer is rejected without blocking or disclosing its path.

## Findings and repairs

The first serial pass was **41/42**. An unsupported explicit financial `$schema`
declaration was classified as known context. The repair limits that declaration
without fetching it or changing the actual bundled-schema result; the targeted
check and subsequent **42/42** run passed.

Static independent review then identified two P2 findings: blocking FIFO open
before file-type rejection, and blank strings inside the required licence list.
The CLI now opens read-only/non-blocking before checking the handle, and financial
meaning checks reject blank licence entries with safe indexed paths. Two focused
regressions were added; the final **44/44** run covers both repairs. Earlier
integration review also corrected optional native empty-string preservation,
historical credits/corrections and structural-versus-semantic reporting.

## Precise unverified limits

No FLOSS/fund or other consumer/version was exercised. Schema tolerance does not
establish extension acceptance, directory eligibility, licensing truth, payment
authority or evidence inspection. The vendored upstream schema remains unchanged,
hash-pinned and separately attributed under [CC BY-SA 4.0](../tools/support-profile/vendor/NOTICE.md).

Only the environment above was exercised. Windows/non-POSIX behaviour, other Node
versions and filesystem races or remote-filesystem stalls were not established by
these checks. Non-blocking open is not a universal timeout for arbitrary storage.

The source routing bullet and worksheet were reviewed, not tested through a fresh
native installation or reliable model selection. The installed skill and library
MCP snapshot/configuration were not updated. No root financial plan, library
record, live support record, application, payment, directory submission or outreach
was changed. Privacy, disclosure permission, authority, impact and real usefulness
remain outside the structural/projection checks.
