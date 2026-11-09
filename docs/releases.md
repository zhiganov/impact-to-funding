# Releases and updates

An installed skill is a snapshot, not a subscription. ItF does not check for new
versions, replace its instructions, or contact GitHub during ordinary skill use.

## Hear about releases

- On the [repository](https://github.com/zhiganov/impact-to-funding), choose
  **Watch → Custom → Releases**, then save your selection. Enable watching
  notifications on GitHub or by email in your account's notification settings.
- Without subscribing or creating an account, check the
  [releases page](https://github.com/zhiganov/impact-to-funding/releases).
- Installing or starring the skill does not subscribe you to releases. GitHub
  handles notification delivery under your settings; no ItF service is involved.

GitHub documents these options in its
[notification guide](https://docs.github.com/en/subscriptions-and-notifications/get-started/configuring-notifications).
Notification delivery to a recipient has not been tested by this project.

## Decide whether to update

A release should tell you what changed, who may benefit, any action needed and
which exact source/host combinations were actually checked. You can keep an older
version if it suits your needs. A source commit or release announcement is not
an instruction to update automatically.

Use the [installation guide's update steps](install.md#update-deliberately) to
inspect your installed SHA, resolve a selected release tag to its full commit,
preserve local work and deliberately switch a clean installation. For a manually
copied package, keep the recorded source revision and replace the complete package
only after preserving the old copy. Host discovery refresh is separate from a
package update.

**Release version and host verification are different.** A release tag identifies
the distributed source. Host evidence applies only to its recorded source SHA,
host/version, installation scope and invocation. Later documentation does not
inherit exact-package verification, even if the skill instructions are unchanged.
Read the [check record](installation-check-2026-11-04.md); do not treat a newer
tag, passing package checks or an experimental prerelease as broad compatibility
or evidence of human usefulness.

## Maintainer release convention

- Publish a GitHub release for a meaningful user-facing batch: changed skill
  behaviour, useful bundled guidance/tools, compatibility or privacy fixes, or
  migration/licensing changes. Batch routine editorial commits rather than
  notifying users about every commit. There is no promised calendar cadence.
- During experimental `v0`, use a new minor version for substantial scope or
  compatibility/licensing changes; use a patch version for smaller corrections.
  This is not a stable-interface guarantee. Keep experimental releases marked
  as prereleases; a version number does not establish readiness.
- Give each release a fixed source tag. Do not move an existing release tag or
  silently replace its source. If a correction changes distributed files, use a
  new version. Correct release-note errors transparently.
- Include changes since the previous release, install/update instructions,
  material migration/licensing changes, exact host-check evidence and untested
  surfaces. Label proposals, optional software and unavailable services honestly.
- Review the actual tagged package for disclosure and source rights and run the
  documented package checks. Include no private traces, local dependency folders,
  credentials or user material. GitHub's tag-based source archives are sufficient;
  no custom installer, release workflow or uploaded build is required here.
- A source prerelease may retain unverified hosts, provided that its notes say
  so. Claim an install-tested release only for an exact released package and the
  supported host actually checked. Do not require more model runs merely to
  publish an honestly bounded source prerelease.

Publishing a source commit does not create a release, and creating a release does
not update users' copies. A local release-note draft is neither a published GitHub
release nor a notification to subscribers. Release publication and any community
announcement are distinct actions; a release is not recruitment or outreach.
