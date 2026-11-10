# Readability check

A local check for drafts: support briefs, reports and profile text. It shows where writing is hard to read, so you can make it plainer before you share it.

It runs on your machine. It sends nothing anywhere and needs no account or key. It needs Node 22 or later.

## Use

```bash
node tools/readability/cli.mjs brief.md
```

Add `--json` for machine-readable output.

A `.json` file is read as a manifest, such as `funding.json` or `itf-manifest.json`. Only its prose strings are checked, and each result shows the JSON path. Other files are read as Markdown or plain text. Headings, code, tables and front matter are skipped.

## What it reports

- **Grade:** the Automated Readability Index, an approximate US school grade. Lower is easier. Grade 8 or below suits most readers.
- **Long sentences:** 20 to 29 words. **Very long:** 30 words or more.
- **Passive voice:** a form of "be" followed by a past participle, such as "was written".
- **Adverbs:** words ending in "-ly", minus common exceptions.

Each flagged sentence shows the line where its paragraph starts.

## Limits

These are simple rules for English. They miss some cases and flag some correct writing. A low grade doesn't make writing accurate or persuasive. Use the results as prompts, and keep any sentence that is clearer as it is.
