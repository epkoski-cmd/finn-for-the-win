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
| `IDEAS.md` | Ideas for further development. Anyone can add to it. |
| `espn.py` | Every request to ESPN lives here. If ESPN changes, only this file needs fixing. |
| `find_finns.py` | The main script: finds Finnish players, their matches and lineups, and saves the result. |
| `streaming_fi.json` | Edited by hand: where each competition can be watched in Finland. Check it once a season. |
| `data/finnish_players.json` | The saved list of Finnish players (rebuilt automatically once a week). |
| `data/matches.json` | The result: matches with Finns, which the website will read. |
| `data/players.json` | Every Finn we follow, grouped by league, for the website's "All Finns" page. |
| `data/history.json` | Finished matches from the last two weeks, for the weekly summary. Kept on the live site between runs. |
| `site/index.html` | The main page: matches by day. |
| `site/week.html` | The "This week" page: goals, assists and who played in the last 7 days. |
| `site/finns.html` | The "All Finns" page: every followed player, with a search box. |
| `site/style.css` | The look of both pages (colours, fonts, layout). |
| `site/shared.js` | Code both pages use: language switch, favourite players, calendar files and the error-report link. |
| `site/untracked.json` | Edited by hand: Finnish players in leagues we can't follow (e.g. Damallsvenskan), shown on the All Finns page. |
| `site/texts.js` | Every text on the site in Finnish and English. Edit wordings here. |

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
- **Parallel requests**: asking ESPN for several things at once instead of one after another, so the script finishes faster.

## Known limits

- ESPN's feeds are unofficial and could change without warning.
- Squads are today's squads, so for old dates a player who has since moved clubs shows up wrong.
- ESPN's data has some errors (e.g. one player listed at two clubs).
- Not covered yet: domestic cups and some leagues (e.g. Poland, Nordic second tiers).
- Women's football: the data source has the English, Spanish, French, Dutch, US, Canadian, Australian and Mexican leagues,
  the Women's Champions League and Helmarit, but not Sweden, Germany, Italy, Norway or Denmark, where many Finnish women play.
- Club squad lists sometimes miss a player (e.g. Leo Walta at LAFC). The script therefore looks up the club of every
  Finland national team player it hasn't found, and adds them if their club is in a league we follow. Players at Finnish
  clubs are skipped on purpose; Finnish clubs are recognised by a code starting with `fin.`, plus `FINNISH_CLUBS_WITHOUT_CODE`.
- A few Finns are listed under another citizenship (e.g. Fredrik Oldrup Jensen as Norwegian). Add them to `EXTRA_FINNS`
  in `find_finns.py`. The website's "Played for Finland, not followed yet" list shows who might be missing.
- The streaming table is partly from a Finnish streaming guide, not official sources. Entries are marked `"confidence": "guide"` until confirmed.
