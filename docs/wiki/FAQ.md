# FAQ

## Does it crawl the whole site?

No, it checks one page at a time. Run it over a list of key pages (or your sitemap URLs) in a loop or a CI matrix.

## Why does a link work in my browser but fail here?

Some sites block automated clients (403, 429) or require JavaScript or cookies. Treat those as "check manually"; the anchor text helps you find them.

## Are redirects a problem?

A redirect is not broken, but every hop slows users down. Update internal links to point to the final URL; use `--redirects` to list them.

## Will it overload the target site?

By default 8 requests run in parallel, mostly HEAD. Lower `--concurrency` for small sites or external checks.

## Are links inside JavaScript-rendered content found?

No, only links in the HTML the server returns.
