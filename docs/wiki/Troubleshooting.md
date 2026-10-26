# Troubleshooting

## Many 403 or 429 results

The target rate-limits or blocks bots. Lower `--concurrency`, raise `--timeout`, and re-check those URLs manually.

## Timeouts on slow hosts

Increase `--timeout` (milliseconds). The default is 15 seconds per request.

## "The page returned HTTP 403"

The page itself blocks automated requests. Check that you can open it without logging in and from the network you run the tool on.

## Still stuck?

Open an [issue](https://github.com/ksanyok/broken-links/issues/new/choose) with the command, the output (`--json` if possible) and your Node.js version — or compare with the [online version](https://promopilot.link/en/tools/broken-links.php?utm_source=github&utm_medium=repo&utm_campaign=tools&utm_content=broken-links).
