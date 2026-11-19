# ItF records for community dashboards: sketch

A sketch for [#102](https://github.com/zhiganov/impact-to-funding/issues/102), 2026-11-15. It defines three record types that a person keeps in their own ATProto account: a profile, contributions and needs. A community dashboard such as My Community could read them to show members each other's work and requests for help. The profile record has since been built into a public-profile app as `org.itfti.profile` (see below); the contribution and need records are still sketches. All examples are fictional.

## The three records

| Record | One per | Required | What it holds |
|---|---|---|---|
| `profile` | person | summary, createdAt | What the person works on, up to 8 areas, a link to their `itf-manifest.json`, an optional badge link and up to 10 report links. |
| `contribution` | contribution | project, role, kind, status, createdAt | One bounded piece of work: the project, the person's role, its kind and period, people who share credit, and public links. It describes the work, not its impact. |
| `need` | request | scope, summary, status, validUntil, createdAt | A request for bounded help, posted to one community, with rough effort, a date and a channel the person chose. It assigns nothing. |

## Conventions

- **The community scope** uses the same shape as My Community's availability record: `{"type": "ca-community", "value": <community id>}`.
- **Needs expire by default.** `validUntil` is required, as on the availability record, so old requests stop showing.
- **Report links follow ItF's contracts.** Field names come from the [support-profile manifest](../references/support-profile-contract.md)'s report entries (`id`, `url`, `period`, `published`, `revision`) and the [impact badge](impact-badge-contract.md) input (`provenance`, `state`).
- **Closed lists where the contract is strict.** `provenance` and `state` accept only the contract's values, so "verified" or a score can't be stored. Other lists, such as `kind`, stay open so apps can add values.
- **Text limits count visible characters** (`maxGraphemes`), so non-Latin text isn't cut short.
- **The namespace.** `org.example.itf.*` was a placeholder; [#10](https://github.com/zhiganov/impact-to-funding/issues/10) says not to invent a production namespace without a decision.
  - **Profile:** the public-profile app for [#7](https://github.com/zhiganov/impact-to-funding/issues/7) uses `org.itfti.profile`, in [itfti-website PR #24](https://github.com/zhiganov/itfti-website/pull/24) (unmerged on 2026-11-19, with namespace control still to be verified). Compared on 2026-11-19, its schema matches the sketch's profile record exactly, apart from the NSID and description text.
  - **Contribution and need:** still `org.example.itf.*`. If they're adopted, `org.itfti.contribution` and `org.itfti.need` would keep them in the same namespace as the profile.

## Validation

Checked with `@atproto/lexicon` 0.7.19 on 2026-11-15. All three schemas and the examples below are valid. These cases are rejected:

- a missing summary, project, scope or `validUntil`;
- a report link without a revision;
- the report state "stale" and the provenance "verified";
- nine areas, where the limit is 8;
- a handle where a DID is required;
- a date written as "next week";
- text longer than its limit, including text in accented characters.

## Schemas

### Profile

```json
{
  "lexicon": 1,
  "id": "org.example.itf.profile",
  "defs": {
    "main": {
      "type": "record",
      "description": "A builder's public ItF profile. Public: include only what the person approves for anyone to read.",
      "key": "literal:self",
      "record": {
        "type": "object",
        "required": [
          "summary",
          "createdAt"
        ],
        "properties": {
          "summary": {
            "type": "string",
            "maxGraphemes": 300,
            "maxLength": 3000,
            "description": "What the person works on, in their own words."
          },
          "areas": {
            "type": "array",
            "maxLength": 8,
            "items": {
              "type": "string",
              "maxGraphemes": 80,
              "maxLength": 800
            }
          },
          "supportProfile": {
            "type": "string",
            "format": "uri",
            "description": "Link to their approved public itf-manifest.json."
          },
          "reports": {
            "type": "array",
            "maxLength": 10,
            "items": {
              "type": "ref",
              "ref": "#reportLink"
            }
          },
          "badge": {
            "type": "string",
            "format": "uri",
            "description": "Link to their itf-badge.json or card, if any."
          },
          "createdAt": {
            "type": "string",
            "format": "datetime"
          },
          "updatedAt": {
            "type": "string",
            "format": "datetime"
          }
        }
      }
    },
    "reportLink": {
      "type": "object",
      "description": "A link to an approved public report. Field names follow the support-profile manifest's reports entry and the impact badge input. The report itself carries the claims and limits.",
      "required": [
        "id",
        "url",
        "revision",
        "provenance",
        "state"
      ],
      "properties": {
        "id": {
          "type": "string",
          "maxLength": 128,
          "description": "The report's id in the person's itf-manifest.json."
        },
        "url": {
          "type": "string",
          "format": "uri"
        },
        "title": {
          "type": "string",
          "maxGraphemes": 120,
          "maxLength": 1200
        },
        "period": {
          "type": "string",
          "maxLength": 64,
          "description": "As in the manifest, e.g. \"2026 Q3\"."
        },
        "published": {
          "type": "string",
          "format": "datetime"
        },
        "revision": {
          "type": "string",
          "maxLength": 64
        },
        "provenance": {
          "type": "string",
          "maxLength": 32,
          "enum": [
            "self-report",
            "ai-assisted",
            "peer-review",
            "independent-evaluation"
          ],
          "description": "The strongest review basis that applies to every shown claim, as in the impact badge contract. Never a score or \"verified\"."
        },
        "state": {
          "type": "string",
          "maxLength": 32,
          "enum": [
            "current",
            "corrected",
            "out-of-date",
            "withdrawn"
          ]
        },
        "statusUrl": {
          "type": "string",
          "format": "uri"
        }
      }
    }
  }
}
```

### Contribution

```json
{
  "lexicon": 1,
  "id": "org.example.itf.contribution",
  "defs": {
    "main": {
      "type": "record",
      "description": "One bounded contribution the person describes themselves. Public. Describes work done or ongoing, not its impact.",
      "key": "tid",
      "record": {
        "type": "object",
        "required": [
          "project",
          "role",
          "kind",
          "status",
          "createdAt"
        ],
        "properties": {
          "project": {
            "type": "ref",
            "ref": "#projectRef"
          },
          "role": {
            "type": "string",
            "maxGraphemes": 120,
            "maxLength": 1200,
            "description": "Their bounded role, e.g. \"one editing pass on the meeting guide\"."
          },
          "summary": {
            "type": "string",
            "maxGraphemes": 500,
            "maxLength": 5000
          },
          "kind": {
            "type": "string",
            "maxLength": 32,
            "knownValues": [
              "code",
              "docs",
              "maintenance",
              "coordination",
              "facilitation",
              "care",
              "research",
              "design",
              "other"
            ]
          },
          "status": {
            "type": "string",
            "maxLength": 32,
            "knownValues": [
              "ongoing",
              "done",
              "historical"
            ]
          },
          "periodStart": {
            "type": "string",
            "format": "datetime"
          },
          "periodEnd": {
            "type": "string",
            "format": "datetime"
          },
          "sharedWith": {
            "type": "array",
            "maxLength": 20,
            "items": {
              "type": "string",
              "format": "did"
            },
            "description": "Others who share credit and agreed to be named. Their own records, if any, are separate."
          },
          "links": {
            "type": "array",
            "maxLength": 5,
            "items": {
              "type": "string",
              "format": "uri"
            },
            "description": "Public links only. Never private evidence."
          },
          "scope": {
            "type": "ref",
            "ref": "#scope"
          },
          "createdAt": {
            "type": "string",
            "format": "datetime"
          },
          "updatedAt": {
            "type": "string",
            "format": "datetime"
          }
        }
      }
    },
    "projectRef": {
      "type": "object",
      "required": [
        "name"
      ],
      "properties": {
        "name": {
          "type": "string",
          "maxGraphemes": 120,
          "maxLength": 1200
        },
        "uri": {
          "type": "string",
          "format": "uri"
        }
      }
    },
    "scope": {
      "type": "object",
      "description": "The community this record is for. Same shape as My Community's availability scope, e.g. {type: 'ca-community', value: <community id>}.",
      "required": [
        "type",
        "value"
      ],
      "properties": {
        "type": {
          "type": "string",
          "maxLength": 64,
          "knownValues": [
            "ca-community",
            "atproto-group"
          ]
        },
        "value": {
          "type": "string",
          "maxLength": 512
        }
      }
    }
  }
}
```

### Need

```json
{
  "lexicon": 1,
  "id": "org.example.itf.need",
  "defs": {
    "main": {
      "type": "record",
      "description": "A request for bounded help, posted to one community. Public. A need assigns nothing; replies and acceptance happen elsewhere.",
      "key": "tid",
      "record": {
        "type": "object",
        "required": [
          "scope",
          "summary",
          "status",
          "validUntil",
          "createdAt"
        ],
        "properties": {
          "scope": {
            "type": "ref",
            "ref": "#scope"
          },
          "summary": {
            "type": "string",
            "maxGraphemes": 300,
            "maxLength": 3000,
            "description": "What help is needed, in the person's own words."
          },
          "effort": {
            "type": "string",
            "maxGraphemes": 80,
            "maxLength": 800,
            "description": "Rough effort, e.g. \"about two hours\"."
          },
          "neededBy": {
            "type": "string",
            "format": "datetime"
          },
          "project": {
            "type": "ref",
            "ref": "org.example.itf.contribution#projectRef"
          },
          "howToRespond": {
            "type": "string",
            "maxGraphemes": 200,
            "maxLength": 2000,
            "description": "A channel the person chose. Not a contact list."
          },
          "status": {
            "type": "string",
            "maxLength": 32,
            "knownValues": [
              "open",
              "met",
              "withdrawn"
            ]
          },
          "validUntil": {
            "type": "string",
            "format": "datetime",
            "description": "Stop showing after this, like the availability record. Expiry is the default."
          },
          "createdAt": {
            "type": "string",
            "format": "datetime"
          },
          "updatedAt": {
            "type": "string",
            "format": "datetime"
          }
        }
      }
    },
    "scope": {
      "type": "object",
      "description": "The community this record is for. Same shape as My Community's availability scope, e.g. {type: 'ca-community', value: <community id>}.",
      "required": [
        "type",
        "value"
      ],
      "properties": {
        "type": {
          "type": "string",
          "maxLength": 64,
          "knownValues": [
            "ca-community",
            "atproto-group"
          ]
        },
        "value": {
          "type": "string",
          "maxLength": 512
        }
      }
    }
  }
}
```

## Fictional examples

```json
{
  "$type": "org.example.itf.profile",
  "summary": "I coordinate access arrangements for community meetings.",
  "areas": [
    "meeting access",
    "facilitation"
  ],
  "supportProfile": "https://example.org/mira/itf-manifest.json",
  "reports": [
    {
      "id": "open-door-2026-q3",
      "url": "https://example.org/mira/report-2026-q3.html",
      "title": "Open Door access report",
      "period": "2026 Q3",
      "published": "2026-10-15T00:00:00Z",
      "revision": "2",
      "provenance": "peer-review",
      "state": "current"
    }
  ],
  "createdAt": "2026-11-15T10:00:00Z"
}
```

```json
{
  "$type": "org.example.itf.contribution",
  "project": {
    "name": "Open Door",
    "uri": "https://example.org/open-door"
  },
  "role": "One editing pass on the meeting guide",
  "kind": "docs",
  "status": "done",
  "periodStart": "2026-10-01T00:00:00Z",
  "periodEnd": "2026-10-08T00:00:00Z",
  "sharedWith": [
    "did:plc:fictionalmira000000000000"
  ],
  "scope": {
    "type": "ca-community",
    "value": "harbour-fictional"
  },
  "createdAt": "2026-11-15T10:00:00Z"
}
```

```json
{
  "$type": "org.example.itf.need",
  "scope": {
    "type": "ca-community",
    "value": "harbour-fictional"
  },
  "summary": "One more editing pass on the meeting guide before the next session.",
  "effort": "about two hours",
  "neededBy": "2026-11-29T00:00:00Z",
  "status": "open",
  "howToRespond": "Reply in the Harbour chat",
  "validUntil": "2027-01-10T00:00:00Z",
  "createdAt": "2026-11-15T10:00:00Z"
}
```

## Limits

These records are public, like all ordinary ATProto records. Write only what the person approves for anyone to read. Members-only needs need Spaces ([#10](https://github.com/zhiganov/impact-to-funding/issues/10)) or a gated store in the community's admin tool. This sketch checks the records' shape only. Saving to a real account and reading them in My Community aren't tested. The fields may change once [#29](https://github.com/zhiganov/impact-to-funding/issues/29)'s handoff questions are answered.
