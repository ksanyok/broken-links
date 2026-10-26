# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-26

### Added
- `broken-links` CLI with `--assets`, `--internal`, `--external`, `--redirects`, `--concurrency`, `--timeout` and `--json`
- Link extraction that ignores comments and scripts, skips mailto/tel/javascript/fragment links, resolves `<base>` and dedupes by URL with occurrence counts and anchor text
- HEAD-first checking with GET fallback for 403/404/405/429/501/5xx, per-request timeouts and a bounded parallel pool
- Detection of 4xx/5xx, timeouts, DNS/connection errors, invalid URLs and redirected links, with nofollow/sponsored/ugc flags
- Library API (`findBrokenLinks`, `extractLinks`, `checkUrl`) with injectable fetch, and GitHub Action

[1.0.0]: https://github.com/ksanyok/broken-links/releases/tag/v1.0.0
