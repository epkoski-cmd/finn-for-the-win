# Ideas

A running list. Pick one per session; move it to **Done** when it's live.
Write ideas down as soon as they come up, even half-formed ones.

## Next

## Maybe later
- **Women's leagues we can't track yet** – find a free data source for Damallsvenskan,
  Toppserien, Serie A Femminile and Kvindeligaen (many Helmarit players are there).
- **More men's leagues** – Poland (Håkans) and Czechia (Mahuta) are missing from the data
  source; look for another free source, or check if more leagues have been added.
- **Player page** – one player's recent matches, goals and next games.
- **Share a single match or player** – e.g. "Pohjanpalo scored twice" as its own picture.
- **Notifications** ("your player is in the starting lineup") – needs a server or push
  service; a bigger learning project.
- **User accounts** – favourites on all devices; mainly as a learning exercise.
- **Own address** (custom domain) instead of github.io.
- Ask friends what they'd want to see.

## Done
- Step 1: script that finds Finns abroad and their matches (free ESPN data).
- Step 2: the website, with streaming info and "Spotted an error?" Google Form.
- Step 3: automatic updates 4× a day with GitHub Actions + GitHub Pages.
- Hand-checked Finnish streaming table, with links for confirmed services.
- Renamed to Finn for the Win (Finn FTW).
- GoatCounter visit stats.
- Favourite players and the "My Finns" filter.
- Goals, assists and own goals.
- "All Finns" page with search.
- Add to calendar (.ics).
- Finnish and English (FI/EN switch).
- Weekly summary page (history kept on the live site).
- Women's football with the Men / Women / All switch.
- "Not tracked yet" list for players in leagues we can't follow.
- Version stamps and update check, so visitors always get the latest site.
- National team players missing from squad lists are found automatically (Leo Walta).
- "Share this week as an image" button on the This week page (canvas picture, phone share menu).
- Link preview pictures (`og:image`): a fixed one for the site, and the week's picture made 4× a day by headless Chrome.
- Calendar events show each Finn's club, e.g. "Kallman (Hannover 96)".
- GitHub Actions updated to current versions; workflow split into build + publish jobs
  (fixes the occasional "No artifacts named github-pages" failure).
- Finnish league names in the Finnish view ("Saksan 2. Bundesliga"), table in `texts.js`.
- Player list rebuilt daily during transfer windows (1.1.–10.2. and 15.6.–10.9.), weekly otherwise.
- Calendar subscription per player ("Subscribe in calendar" on the All Finns page; .ics files in English, updated 4× a day).
- Fewer requests to ESPN: past days from the history, cached league names and club lookups, no run for notes-only pushes (~710 → ~500 per run).
- National team players are remembered for a year, so players missing from squad lists (Leo Walta) stay found between international windows.
- Further-ahead fixtures: club league fixtures to the end of the season in calendar subscriptions and the All Finns "Next:" line (fetched once a day).
- Safety net for Finns missing from squad lists (`MISSING_FROM_SQUADS`): Leo Walta stays followed at LAFC.
- My Finns on top: followed players' matches come first in the day list, then an "Other matches" heading (sorted when the list is drawn, so tapping a star doesn't move anything).
- Match of the day: a banner above the day's list, linking to the biggest match (Finland first, then Champions League,
  the big five leagues…). Separate men's and women's rankings; the All view shows one of each. Skipped once lineups show
  every Finn on the bench, and on days with only one match.
- WSL in Finland: free on the league's own YouTube channel (no Finnish TV partner), confirmed from the league's TV guide.
