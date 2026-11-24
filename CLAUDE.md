# Finn for the Win – notes for Claude

A website showing which Finnish footballers play abroad on a given day, and
where each match can be watched legally in Finland. Built as a vibe-coding
**learning project**: explain changes in plain language, go in small steps,
and keep the code readable for a beginner.

Live site: https://epkoski-cmd.github.io/finn-for-the-win/ (repo `epkoski-cmd/finn-for-the-win`).
Ideas and next steps live in `IDEAS.md`. File-by-file overview in `README.md`.

## Who uses it
- Friends and family in Finland, **mostly on phones**, often in Finnish.
- Public but not advertised, non-commercial.

## What the site is (and isn't)
- **Finns playing abroad.** Finnish leagues (Veikkausliiga etc.) are out of scope on purpose,
  including national team players at Finnish clubs.
- **Legal Finnish streaming only. Never list betting sites**, even if they stream matches.
- **Don't name the data source (ESPN) on the site.** The footer says "public sports data feeds".
- Text only: no logos, player photos or club badges.
- **Privacy:** no cookies, no accounts, no personal data. Favourites and settings stay in the
  visitor's browser (`localStorage`). The only counter is GoatCounter (anonymous).
- No servers or paid services. Everything runs on GitHub Actions + GitHub Pages for free.
- Don't promise what we can't deliver (e.g. no "ask us to follow" for leagues we can't track).

## How the code is laid out
- `espn.py` – every request to the data source. If it changes, only this file needs fixing.
- `find_finns.py` – the main script: player list, matches, lineups, goals, history.
  Settings at the top (leagues, days, exception lists).
- `streaming_fi.json`, `site/untracked.json` – **edited by hand**; keep `checked` dates and sources.
- `site/` – the website: plain HTML, CSS and JavaScript. No frameworks, no build step, no npm.
  `shared.js` (helpers, favourites, language, calendar, update check), `texts.js` (all texts),
  `style.css`, and one HTML file per page (`index`, `week`, `finns`).
- `.github/workflows/update-site.yml` – runs the script 4× a day and publishes the site.

## Rules learned the hard way
- **Every visible text goes in `texts.js`, in both Finnish and English.** Never hard-code UI text.
- **Adding a league or cup in `find_finns.py`? Add its Finnish name to `LEAGUE_NAMES_FI`** in `texts.js`
  (shown with `leagueName()`). Without it, the Finnish view falls back to the English name.
  Also place it in `MATCH_OF_THE_DAY_RANKING` in `shared.js` (otherwise it ranks below everything listed).
- **Link new CSS/JS files with `?v=__VERSION__`.** The workflow replaces it with the commit
  version, so browsers never mix old and new files. Open tabs reload via `version.json`.
- Insert data with `textContent` (the `el()` helper), never `innerHTML`.
- Wrap every `localStorage` read and write in `try/catch` (private browsing can refuse it).
- **No `confirm()` or `prompt()` pop-ups**: phone browsers block them silently.
- **Streaming info:** `"confidence": "official"` only when confirmed by the broadcaster, the
  league, or the site owner. Only official entries get a link. Otherwise mark "unconfirmed".
  Check that a link really opens the right page (Viaplay sends unknown addresses to its front page).
- **The data source has errors.** Known ones and their fixes:
  - wrong citizenship → `EXTRA_FINNS`
  - player listed at a club they don't play for → `WRONG_CLUBS`
  - player missing from a squad list → found through national team lineups automatically; for a player we
    know plays at a followed club (Leo Walta at LAFC), also add them to `MISSING_FROM_SQUADS` as a safety net
  - Finnish club without a `fin.` code → `FINNISH_CLUBS_WITHOUT_CODE`
  - scoreboard date ranges fail → fetch one day at a time
  - the data source's "day" is US time → also fetch the day before
- **Python 3.8 locally, 3.12 on GitHub:** standard library only, no `zoneinfo`.
- Raise `HISTORY_VERSION` when the history's contents change, so it rebuilds itself once.
- Keep requests to the data source modest (about 500 per run, plus ~55 club fixture lists once a day; see "Requests to the data source" in README.md):
  cache the player list (weekly; daily in transfer windows), don't re-ask past days that are in the history,
  remember things that rarely change in the player list's `cache`, keep parallel requests at 6, and don't add
  per-visitor requests (visitors only read saved files). Pushes that only change `.md` files don't run the update.

## How we work
- **One feature at a time.** Agree on the plan, build it, test it, publish it, then the next.
- **Test before publishing:** run `find_finns.py`, then check the page locally at **phone and
  desktop width**, in **both languages** and in the **Men / Women / All** views.
  Clear test favourites and settings from the browser afterwards.
- **After pushing, check the live site:** watch the workflow run, then confirm the new
  files and data are really there.
- Be honest about what was and wasn't checked, and about uncertain data.
- Keep `README.md` (file table, known limits) and `IDEAS.md` up to date.
- Commit messages say what changed and why.

## Working on it
- Update data: `python3 find_finns.py` (or `python3 find_finns.py 2026-11-08` for another date).
- Run the site locally: copy `data/*.json` to `site/data/`, then `python3 -m http.server 8765`
  in `site/`, and open http://localhost:8765. (The preview tool can't start Python in
  ~/Documents, so start it from the shell and attach the preview to the URL.)
- Deploy: commit and push to `main`; the workflow publishes in about a minute
  (`gh run watch`). The GitHub CLI is at `~/.local/bin/gh`.
- Git identity in this repo uses the GitHub noreply email.
