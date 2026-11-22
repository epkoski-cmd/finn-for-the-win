# Ideas

A running list. Pick one per session; move it to **Done** when it's live.
Write ideas down as soon as they come up, even half-formed ones.

## Next


## Maybe later
- **Women's leagues we can't track yet** – find a free data source for Damallsvenskan,
  Toppserien, Serie A Femminile and Kvindeligaen (many Helmarit players are there).
- **More men's leagues** – Poland (Håkans) and Czechia (Mahuta) are missing from the data
  source; look for another free source, or check if more leagues have been added.
- **WSL broadcaster in Finland** – not confirmed yet; check Viaplay / Disney+ / others.
- **Further-ahead fixtures** – show or add to calendar matches beyond 7 days
  (e.g. each followed player's club schedule). Would also make calendar subscriptions more useful.
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
