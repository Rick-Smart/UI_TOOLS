# Native KB Workflow

This folder contains the initial KB update pipeline for AZUI content:

1. `crawl` source pages
2. `diff` against previous crawl
3. `update` normalized KB entries
4. `report` changes for review

## Commands

- `npm run kb:crawl`
- `npm run kb:diff`
- `npm run kb:update`
- `npm run kb:report`
- `npm run kb:run` (runs all four in order)

## Files

- `kb/config.json` - crawl scope, limits, and policy controls.
- `kb/schema.json` - expected article structure.
- `kb/data/crawl-latest.json` - newest crawl snapshot.
- `kb/data/crawl-previous.json` - previous crawl snapshot.
- `kb/data/diff-latest.json` - added/changed/removed URLs.
- `kb/data/articles.json` - normalized KB entries.
- `kb/reports/latest.md` - most recent human-readable change report.

## Update policy

- Respect `robots.txt` rules and crawl pacing.
- Keep scope focused to unemployment-individual pages first.
- Review `kb/reports/latest.md` before publishing major changes.
