# Getting started

## Requirements

Node.js 18 or newer. No other dependencies.

## Install

```bash
# one-off run
npx github:ksanyok/broken-links example.com

# global CLI
npm install -g github:ksanyok/broken-links

# as a library in your project
npm install github:ksanyok/broken-links
```

## First run

```bash
broken-links example.com
```

The header shows how many URLs were checked, split into internal and external, and the totals. Every broken URL is listed with its status (or `ERR` and the reason) and the anchor text it appears with, so you can locate it. With `--redirects`, redirected links follow with their destination. Exit code is 1 when anything is broken.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | No errors (warnings allowed unless `--strict`) |
| 1 | Errors found (or warnings with `--strict`) |
| 2 | Bad arguments or the check could not run |

## More examples

**Include images, scripts and stylesheets**

```bash
broken-links https://example.com --assets
```

**Only outbound links, slower and gentler**

```bash
broken-links https://example.com/resources --external --concurrency 3 --timeout 30000
```

**Export results**

```bash
broken-links https://example.com --json | jq -r '.broken[] | "\(.status) \(.url)"'
```

## Without installing anything

Use the [online Broken Link Checker](https://promopilot.link/en/tools/broken-links.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=broken-links).
