# Broken Link Checker

`broken-links` loads a page, collects every link — and with `--assets` every image, script, stylesheet and iframe — and checks them all in parallel. Each URL gets a lightweight `HEAD` request, with a `GET` fallback for servers that reject `HEAD`, a timeout, and redirect following. The report lists what is broken (4xx, 5xx, timeouts, DNS failures, malformed URLs) together with the anchor text, so you can find the link on the page, plus which links go through redirects.

- **[Getting started](Getting-Started)** — install, first run, reading the output
- **[FAQ](FAQ)** — common questions
- **[Troubleshooting](Troubleshooting)** — errors and how to fix them

Prefer a browser? The same check runs online at **[PromoPilot](https://promopilot.link/en/tools/broken-links.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=broken-links)** — free, no sign-up.
