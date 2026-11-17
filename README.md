# Finn to Win

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
| `espn.py` | Every request to ESPN lives here. If ESPN changes, only this file needs fixing. |
| `find_finns.py` | The main script: finds Finnish players, their matches and lineups, and saves the result. |
| `streaming_fi.json` | Edited by hand: where each competition can be watched in Finland. Check it once a season. |
| `data/finnish_players.json` | The saved list of Finnish players (rebuilt automatically once a week). |
| `data/matches.json` | The result: matches with Finns, which the website will read. |

## Running it

Open the Terminal, go to this folder, and run:

```
python3 find_finns.py               # today, plus 3 days either side
python3 find_finns.py 2026-11-08    # around a chosen date (for testing)
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
- Not covered yet: domestic cups, women's football, and some leagues (e.g. Poland, Nordic second tiers).
- The streaming table is partly from a Finnish streaming guide, not official sources. Entries are marked `"confidence": "guide"` until confirmed.
