# Prepare ItF release notes

This is a maintainer guide for the ItF repository. It isn't part of the
Impact to Funding skill, which never loads it. Follow `AGENTS.md` for writing
style and pull requests, and `docs/releases.md` for the release convention.
It prepares notes, a version bump and a pull request. It doesn't tag, publish or announce anything.

## 1. Fix the range

- Fetch `main` and tags. Find the previous release tag (`git tag --sort=-creatordate`).
- Pin the target as a full commit SHA on `main`. Don't use a branch name: `main`
  can move while you work.
- If the previous release's tag is missing, say so and ask which commit to use.

## 2. List every change from Git, not memory

- `git log --no-merges --format='%h %s%n%b' <previous-tag>..<target>`.
- `git diff --stat <previous-tag> <target> -- SKILL.md playbooks references assets tools mcp`
  shows which shipped parts changed.
- Note each change's PR and issue numbers from the commit messages. Where a
  message doesn't give them, leave them out rather than guess.
- For work you didn't do in this session, read the change's own docs or commit
  message, and mark it in the pull request as described from those sources.

## 3. Draft the notes

Copy the structure of the latest file in `docs/releases/`:

1. A title and a one-line summary, with "Experimental source prerelease" while ItF is `v0`.
2. **What changed in the skill:** behaviour people will notice, each with its PR.
3. **New or changed local tools.**
4. **Docs:** only changes a user would look for.
5. **Use and updates:** how to get this version. Existing copies don't update themselves.
6. **Evidence and limits:** checks actually run, with versions, and what wasn't checked.
7. The licence line from the previous notes.

Write in the plain style from `AGENTS.md`. Never claim a check you didn't see pass.

## 4. Prepare the release pull request

- Add `docs/releases/v<version>.md`.
- Pick the version by the convention in `docs/releases.md`: a minor bump for a
  substantial batch, a patch for small corrections.
- Bump `metadata.version` in `SKILL.md`.
- Make the new version the current release in `docs/README.md`.
- Leave older version mentions that describe history, such as when a feature first shipped.
- Check coverage: every PR number in the range's commit messages should
  appear in the notes, or be left out on purpose (for example a docs-only change).
  Issue numbers that sit beside a PR number don't need their own mention.
- Run the package tests (`node --test tests/*.test.mjs`, from a checkout folder
  named `impact-to-funding`) and each changed tool's tests.
- Open the pull request. List anything you described from sources rather than
  your own work.

## 5. Stop

Don't create the tag, publish the GitHub release or announce it. Give the
maintainer the exact commands for the merge commit, and offer to check the
release once it's published.

Once the release is published, the **Release plugin** workflow
(`.github/workflows/release-plugin.yml`) does the rest on its own:

- builds the Claude Code plugin from the tagged commit, with its library runtime,
  and checks that two builds match;
- validates it with `claude plugin validate`;
- zips it with `tools/claude-plugin/zip.mjs` and attaches the zip to the release;
- rewrites the release page's text from `docs/releases/v<version>.md`, with links
  pinned to the tagged commit and a "Release files" section (the zip's SHA-256, the
  run that built it, the runtime's snapshot and dependencies);
- opens a pull request pointing `.claude-plugin/marketplace.json` at that zip, with
  its SHA-256.

So when publishing, paste anything as the release text: the workflow replaces it.
Check the run in the Actions tab and merge the marketplace pull request.

To rewrite a release's text, run the workflow by hand with its tag. It reuses the
zip already attached, because the marketplace pins its SHA-256. Tick "rebuild" only
to replace the zip on purpose, and then merge the new marketplace pull request
straight away.

The workflow needs **Settings → Actions → General → Allow GitHub Actions to create
and approve pull requests**. Without it, the zip is still attached and the branch is
pushed; open the pull request by hand.

To build by hand instead, follow `tools/claude-plugin/README.md`, and zip the folder
with `node tools/claude-plugin/zip.mjs <folder> <zip> --date <tag commit date>`.

## Contributors

Thank contributors only by verified GitHub identity, from commit authors or
pull request data. Never guess a handle, and never thank the person who merged
as a stand-in for the author.
