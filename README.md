# Finn for the Win (Finn FTW)

A website that shows which Finnish footballers play abroad on a given day,
and where each match can be streamed legally in Finland.

This is a learning project. The notes below explain how each piece works.

## How the system fits together

```
ESPN data feeds ──> find_finns.py ──> data/matches.json ──> website (coming in step 3)
                    (runs a few times a day)               (visitors only read the saved file)
```

Visitors never contact ESPN. Only the script does, a few times a day.
This is called **caching**: do the slow work once, hand everyone the result.

## The files

| File | What it is |
|---|---|
| `CLAUDE.md` | Rules and working practices for this project (read automatically by Claude). |
| `VISION.md` | What the site is for, what success looks like, and the stages it grows in. Ideas are measured against it. |
| `IDEAS.md` | Ideas for further development. Anyone can add to it. |
| `espn.py` | Every request to ESPN lives here. If ESPN changes, only this file needs fixing. |
| `find_finns.py` | The main script: finds Finnish players, their matches and lineups, and saves the result. |
| `streaming_fi.json` | Edited by hand: where each competition can be watched in Finland. Check it once a season. |
| `data/finnish_players.json` | The saved list of Finnish players (rebuilt automatically once a week, and daily during transfer windows: January to early February, mid-June to early September). |
| `data/matches.json` | The result: matches with Finns, which the website will read. |
| `data/players.json` | Every Finn we follow, grouped by league, for the website's "All Finns" page. |
| `data/calendars/<id>.ics` | One calendar file per player, rewritten on every run: the coming week, then the club's league fixtures to the end of the season. Visitors subscribe to them from the All Finns page ("Subscribe in calendar"). Always in English. |
| `data/national_team_players.json` | Everyone who has played for Finland in the last year (from the history's national team lineups). Used to find Finns missing from club squad lists, also between international windows. Kept on the live site between runs, like the history. |
| `data/history.json` | Finished matches from the last two weeks, for the weekly summary. Kept on the live site between runs. |
| `.github/workflows/update-site.yml` | The automatic update, 4× a day and on every push. Two jobs: **build** (run the script, draw preview pictures, package the site) and **publish** (put it on GitHub Pages). |
| `site/index.html` | The main page: matches by day, followed players' matches first. |
| `site/week.html` | The "This week" page: goals, assists and who played in the last 7 days. |
| `site/finns.html` | The "All Finns" page: every followed player, with a search box. |
| `site/style.css` | The look of both pages (colours, fonts, layout). |
| `site/share.js` | Draws the share picture and the link preview pictures on a canvas. The "Share this week as an image" button: draws the week's goalscorers and assists on a canvas and opens the phone's share menu (or downloads the picture on a computer). |
| `site/weekdata.js` | Adds up the last 7 days (goals, assists, who played). Used by the This week page and the link preview. |
| `site/preview.html` | Hidden helper page. The workflow opens it in Chrome and saves screenshots as `preview-site.png` and `preview-week.png`: the pictures shown when a link is pasted into WhatsApp etc. Always English. |
| `site/shared.js` | Code both pages use: language switch, favourite players, calendar files and the error-report link. Also `MATCH_OF_THE_DAY_RANKING`: the order of competitions, biggest first, used to pick the match of the day (move a line to change the order). |
| `site/untracked.json` | Edited by hand: Finnish players in leagues we can't follow (e.g. Damallsvenskan), shown on the All Finns page. |
| `site/fonts/` | The site's two fonts (Barlow Condensed, Inter), served from our own site so visitors' browsers don't contact Google. `fonts.css` lists them; the OFL files are their free licences. |
| `site/texts.js` | Every text on the site in Finnish and English. Edit wordings here. At the end, `LEAGUE_NAMES_FI`: Finnish league names by league code (English shows the data source's name). |

## Requests to the data source

We try to ask ESPN as little as possible. A normal run makes about **500 requests**:

| What | Per run |
|---|---|
| Matches per competition and day: 55 competitions × 9 days (today, the next 7 days, plus the US day before) | 495 |
| Lineups and goals for today's started matches | 10–40 |
| Each club's league fixture list (clubs with Finns), for matches after the coming week: **once a day**, on the day's first run | ~55 |

- Past days are taken from the history once they've been fetched after they end (normally on the day's first run).
- League names and national team players' clubs are remembered in the player list's `cache` until the weekly rebuild.
- The player list rebuild is about 750 requests (league squads plus the Women's Europa Cup's ~45 squads): weekly, or daily during transfer windows.
- The update runs 4× a day, plus on every push, except pushes that only change `.md` files (IDEAS.md, README.md…).

So a normal day is about 2,250 requests (until 2026-11-22 it was about 2,950).

## Running it

Open the Terminal, go to this folder, and run:

```
python3 find_finns.py               # 3 days back to 7 days ahead of today
python3 find_finns.py 2026-11-08    # the same, around a chosen date (for testing)
```

The first run takes about a minute and a half, because it checks every squad.
Later runs reuse the saved player list and are quicker.

## Words you'll meet

- **API**: a web address that returns data for programs instead of a page for people.
- **JSON**: the text format the data comes in, e.g. `{"name": "Ville Koski", "citizenship": "Finland"}`.
- **UTC**: universal time. We store times in UTC and convert to Finnish time for display.
- **Join**: matching two sets of data on a shared key, e.g. a match's team ID against the team IDs of Finnish players.
- **Canvas**: a blank drawing area in the browser. Our code writes text and shapes on it and saves it as a picture.
- **Web Share API**: lets a web page open the phone's own share menu (WhatsApp, Messages…). Most computers don't have it, so there we download the file instead.
- **Link preview (Open Graph)**: hidden `<meta property="og:…">` lines in a page's `<head>`. Chat apps read them to show a title, text and picture when a link is pasted.
- **Headless Chrome**: Chrome running without a window, controlled by a script. The workflow uses it to take screenshots.
- **Parallel requests**: asking ESPN for several things at once instead of one after another, so the script finishes faster.

## Known limits

- ESPN's feeds are unofficial and could change without warning.
- Squads are today's squads, so for old dates a player who has since moved clubs shows up wrong.
- ESPN's data has some errors. A player listed at a club they don't play for (e.g. Fredrik Oldrup Jensen at NAC Breda
  as well as Aris) is fixed by hand in `WRONG_CLUBS` in `find_finns.py`.
- Not covered yet: domestic cups and some leagues (e.g. Poland, Nordic second tiers).
- Women's football: the data source has the English, Spanish, French, Dutch, US, Canadian, Australian and Mexican leagues,
  the Women's Champions League and Helmarit, but not Sweden, Germany, Italy, Norway or Denmark, where many Finnish women play.
  The Women's Europa Cup's squads are scanned too (`SCANNED_CUPS`), so Finns at Swedish, Norwegian and Danish clubs show up
  for their **cup** matches only; the All Finns page marks them "only cup matches shown" in the Not tracked yet list.
  Women's Europa Cup streaming in Finland (UEFA.tv) is unconfirmed for 2026/27: re-check before the February quarter-finals.
- Club squad lists sometimes miss a player (e.g. Leo Walta at LAFC). The script therefore looks up the club of every
  Finland national team player of the last year (`national_team_players.json`) it hasn't found, and adds them if their club is in a league we follow. Players at Finnish
  clubs are skipped on purpose; Finnish clubs are recognised by a code starting with `fin.`, plus `FINNISH_CLUBS_WITHOUT_CODE`.
  Players we know about are also listed by hand in `MISSING_FROM_SQUADS` (Walta at LAFC), so they stay followed even
  without Finland matches; the script warns if ESPN shows them at another club.
- A few Finns are listed under another citizenship (e.g. Fredrik Oldrup Jensen as Norwegian). Add them to `EXTRA_FINNS`
  in `find_finns.py`. The website's "Played for Finland, not followed yet" list shows who might be missing.
- Match of the day is picked by a hand-made ranking of competitions (a Finland match always first), not by the teams'
  strength, so a Bundesliga relegation battle beats an Eredivisie title match. Before lineups are out we can't know
  whether the Finn plays; once they are, a match where every Finn sat on the bench or was left out is skipped.
  A view with only one match that day shows no banner.
- The streaming table is partly from a Finnish streaming guide, not official sources. Entries are marked `"confidence": "guide"` until confirmed.
- The share picture fits about 4–5 goalscorers; in busy weeks the rest become "+ N more". Sharing a file needs a fairly
  new phone browser; older ones download the picture instead.
- Chat apps remember a link's preview, sometimes for days, so a pasted This week link may show an older week's picture.
- Calendar subscriptions hold the player's matches from 3 days back to 7 days ahead (cups and national team included),
  then their club's league matches to the end of the season. Cup and national team matches show up only a week ahead.
  Far-off kickoff times are often not set yet: those are all-day events marked "time TBC". Older events disappear
  from the calendar. The calendar app decides how often it checks for changes (Google can take up to a day). They're per player,
  because the site doesn't know whom a visitor follows (stars stay on the phone).
