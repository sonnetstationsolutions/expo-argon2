# Releasing

How a new version of `@sonnetstationsolutions/expo-argon2` gets published. This is the recurring, project-lifetime process. The one-time account/registry bootstrap — creating the npm org, the first manual publish that creates the package, and configuring the trusted publisher — is a separate maintainer setup task done exactly once and is not repeated per release.

## How publishing works

Releases are **tag-driven and token-free**. Pushing a `vX.Y.Z` tag runs [`.github/workflows/release.yml`](.github/workflows/release.yml), which re-runs the full check suite, verifies the tag matches `package.json`, and publishes to npm via **trusted publishing (OIDC)** with provenance. There are no npm secrets in the repository.

## Versioning: the byte-compatibility rule drives SemVer

This package exists to produce **byte-for-byte identical Argon2 output for fixed inputs** (see [CONTRIBUTING.md](CONTRIBUTING.md), "the one hard rule"). That governs how versions are bumped:

- **MAJOR** — any change to derived output for existing parameters. This silently breaks every consumer's stored keys and ciphertext; it is the most severe change possible here. It must be called out explicitly, with regenerated vectors.
- **MINOR** — additive, backward-compatible API (new parameters or exports) with unchanged output for existing inputs.
- **PATCH** — fixes, docs, and native/build internals that change neither the output nor the public API.

`npm run vectors:check` and the frozen reference vector are the guardrail: if derived output changed unintentionally, CI fails before anything is released.

## Cutting a release

A release is **two actions**: a PR for the bump (subject to branch protection), then a tag (not subject to branch protection).

1. **Bump PR.** On a branch, raise `version` in `package.json` and add the `CHANGELOG.md` entry. Open a PR, let CI pass, and merge to `main`. Branch protection means the bump cannot be pushed directly to `main`.
2. **Tag the merged commit.**
   ```sh
   git checkout main && git pull
   git tag vX.Y.Z          # must equal "v" + the version you just merged
   git push origin vX.Y.Z
   ```
   (Equivalently: GitHub → Releases → "Draft a new release", target `main`, and create the tag there.)
3. **CI publishes.** `release.yml` runs the checks, asserts `tag == v + package.json version`, and publishes over OIDC with provenance.

### Why the tag isn't a PR

- Branch protection guards *branches*; a tag push is not a push to `main`, so it isn't blocked — that is what makes the tag step possible.
- **Order is enforced:** the tag must point at a commit that already carries the bumped version, or the workflow's guard fails. So tag *after* the bump PR merges, never before.
- Pushing a tag requires write access, so fork pull requests cannot trigger a publish.

### Rules of thumb

- The tag must exactly equal `v` + the `package.json` version, or the release fails its guard.
- npm rejects republishing an existing version. If a release run fails *after* the publish step, do not re-tag the same version — bump to the next patch and tag that.
- Don't tag a version that was already published manually (e.g. the initial `0.1.0` bootstrap).

## Optional automation

If the bump-PR + tag two-step ever becomes tedious, adopt **release-please** or **changesets**: a bot maintains the version/changelog bump as a PR, and merging it auto-creates the tag (which triggers `release.yml`). Not currently wired up — the manual two-step is appropriate for this project's release cadence.
