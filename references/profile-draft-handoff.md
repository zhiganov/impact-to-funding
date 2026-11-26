# Prepare an impact-profile draft for app.itfti.org

Use this guide when someone asks their agent to create or update a public impact profile for [app.itfti.org](https://app.itfti.org). The agent prepares a local JSON file. The person imports it and handles sign-in and publication in the app.

## 1. Establish the approved content

Read the current profile or the material the person supplied. Keep their own wording, report IDs, revisions, review basis and state faithful to the source. Include only content they approve for anyone to read.

The app loads the current source record when the person imports the file. It preserves `createdAt` and compatible unknown fields. Do not put those fields in the draft.

## 2. Write the local draft

Use this wrapper exactly:

```json
{
  "format": "itf.profile-draft/0.1-local",
  "changes": {
    "summary": "A replacement summary",
    "areas": ["One area", "Another area"],
    "supportProfile": "https://example.org/itf-manifest.json",
    "badge": "https://example.org/itf-card.html",
    "reports": []
  }
}
```

Every field inside `changes` is optional, but at least one is required.

| Field | Replacement value |
|---|---|
| `summary` | One string. |
| `areas` | An array of strings. Use `[]` to clear all areas. |
| `supportProfile` | An HTTPS URL string. Use `""` to clear it. |
| `badge` | An HTTPS URL string. Use `""` to clear it. |
| `reports` | An array of report objects. Use `[]` to clear all reports. |

Supplied fields replace the corresponding editor fields. Omitted fields stay unchanged. Reports use the app's string fields. Required fields are `id`, `url`, `revision`, `provenance` and `state`. Optional fields are `title`, `period`, `published` and `statusUrl`.

The app rejects unknown fields, non-string values, unsupported format versions and drafts over 48,000 UTF-8 bytes. Do not add account identifiers, record-managed timestamps such as `createdAt` or `updatedAt`, OAuth data, credentials or instructions to the file.

See the app's complete [fictional JSON example](https://app.itfti.org/examples/profile-draft-fictional.json) and [format notes](https://github.com/zhiganov/itfti-website/blob/main/app/README.md#agent-prepared-drafts). The example is not evidence about a real person.

Write the draft to a destination the person chooses, outside this skill's checkout. Give them that path.

## 3. Hand off for review and publication

Ask the person to:

1. Open [app.itfti.org/edit](https://app.itfti.org/edit) and sign in with the account that holds the profile.
2. Under **Import a profile draft**, choose the JSON file.
3. Check every changed field and any fields the import cleared.
4. Select **Review before publishing** and inspect the complete public preview.
5. Publish only if the preview is correct, using the app's normal approval checkbox.

Import changes only the current browser tab. It does not save or publish anything. The app validates the candidate and checks the source CID on publication. A source conflict requires a fresh review rather than another blind write.

## Limits

This is a file handoff, not an MCP connection or automatic publisher. The agent cannot confirm the app's validation or public result unless it actually inspects them through an authorised route. Keep private evidence and other people's contact details out of the draft.
