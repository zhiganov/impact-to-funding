# Local portable impact records

This optional tool exchanges versioned records as JSON and readable Markdown.
It implements the local file-conversion slice of the [#14 record design][design].
It needs Node.js 22+ and has no package dependencies.

The output preserves authorship labels, dissent, evidence-access limits, correction
links and exact review targets. A performed review carries local content digests
for its subject and examined evidence. Changing that content under the same version
label makes validation fail. A prior review stays attached to its original version.

## Run it

Keep inputs and outputs in a private working folder outside this checkout. From a
workspace containing a trusted source copy at `./impact-to-funding` and an existing
private folder at `./work`:

```sh
node ./impact-to-funding/tools/portable-records/cli.mjs inspect ./work/packet.json
node ./impact-to-funding/tools/portable-records/cli.mjs export ./work/packet.json --output ./work/exported
node ./impact-to-funding/tools/portable-records/cli.mjs import ./work/exported/packet.md --output ./work/imported
```

`inspect` accepts JSON or this tool's generated Markdown. It prints local record
digests and review-binding results. It keeps narrative content out of diagnostics.

`export` creates `packet.md` and `conversion-receipt.json`. `import` creates
`packet.json` and a receipt; it also accepts JSON input. Both require a new output
directory and refuse existing paths. On POSIX systems, directories use `0700` and
files use `0600`. Windows permissions follow the filesystem's own controls.

The [entirely fictional guild report](examples/guild-report.json) is a runnable
input. To try it, copy that file into your private working folder. It includes an
overstated claim, its exact review, a corrected claim and a report that keeps the
old review in scope. The other two session statuses stay unknown.

## Local format

The experimental identifier is **`itf.packet/0.1-local`**. It selects this local
file contract, separate from `itf.support/0.1-proposal` support manifests.

- A packet requires `contentModel`, `packetId`, `revision`, `disclosure.audience`
  and `objects`. Audience is `private`, `restricted` or `public`; it describes
  supplied permissions and does not enforce access.
- Each inline object requires `id`, `revision`, `kind` and a supplied `author`
  label. A missing author can be honestly labelled `unknown`; a DID is optional.
  Object IDs and revisions are explicit strings. Duplicate pairs are refused.
- A local reference is `{ "type": "local", "id": "claim-1", "revision": "1" }`.
  Its exact version must be included. Otherwise supply `availability` as
  `not_supplied`, `withheld`, `inaccessible`, `deleted`, `withdrawn` or `unavailable`.
  These states stay distinct. A locator can remain outside the packet.
- Use packet-level `unavailableVersions` for availability changes after a review.
  It contains local references with an `availability` state. This preserves the
  reviewed object's original content and digest when its evidence payload is omitted.
- A `review` or `peer-review` requires `status` and a local `subject` reference.
  Status is `requested`, `pending`, `performed` or `withdrawn`. Performed reviews
  also require `finding`, `independence` and an `evidenceExamined` array, which may
  be empty. The subject and examined evidence require `digest` values. `inspect`
  lists the digests needed when deliberately authoring a review.
- Digests use SHA-256 over this tool's sorted-key JSON representation of a whole
  object. Arrays retain order. This is a local content binding, distinct from an
  AT Protocol CID or a signature. Receipts separately hash raw source bytes.
- A `supersedes` local reference records a correction relationship. Cycles and
  self-supersession are refused. The tool never guesses the newest revision by
  sorting labels or moves a review onto another version.
- Other fields and unknown optional data survive conversion unchanged. They remain
  supplied data. Opaque transport references can be carried this way; they receive
  no AT URI or host-compatibility validation. Critical extensions are unsupported.
- Use strings for decimal quantities, exponent notation and integers outside the
  safe numeric range. This preserves units, precision and unknown values without
  numeric rounding. Inputs use strict UTF-8 JSON with unique keys, at most 1 MiB,
  64 nesting levels and 1000 inline objects. Generated Markdown is capped at 8 MiB.

## Editing and information loss

Generated Markdown contains a readable view and a complete JSON payload. Import
checks that both agree with the generated format. Editing the readable view alone
is refused; it cannot silently restore an older hidden payload. Edit the JSON
source, assign appropriate revisions and review bindings, then export again.
Ordinary unstructured Markdown can be kept as an explicit narrative field in a
packet. The importer does not infer claims or reviewers from prose.

The round trip preserves supplied JSON values. Formatting and key order may change.
The receipt records this transformation and the source's audience. Missing evidence
produces an incomplete binding result even when a review was declared performed.

## Limits

Outputs inherit the source restrictions. This tool creates local exchange files;
public derivatives still need separate curation and approval. It provides no public
projection or automatic redaction. Keep restricted locators out when they are not
needed for the intended exchange.

Validation checks local structure and content bindings. Author, review, permission
and authenticity statements remain supplied claims. The tool sends nothing to
ATProto, Groups, an MCP server or a model provider. Live transport, Lexicons and
namespaces remain separate work. This tool is independent of the Groups pilot.

## Checks and rights

```sh
node --test tools/portable-records/tests/*.test.mjs
```

Original code and tests use [MIT](../../LICENSE-CODE). Written guidance and the
fictional JSON example use [CC BY-SA 4.0](../../LICENSE-CONTENT.md). Private inputs
and generated copies retain their own rights.

[design]: https://github.com/zhiganov/impact-to-funding/issues/14#issuecomment-6647672210
