# Ideas

A running list. Pick one per session; move it to **Done** when it's live.
Write ideas down as soon as they come up, even half-formed ones.

## Next
- **Finnish league names** – "Saksan 2. Bundesliga" instead of "German 2. Bundesliga"
  in the Finnish view. A small name table in `texts.js`.
- **Housekeeping: update the GitHub Actions versions** – runs warn that Node 20 is being
  retired. Small change, but do it before it starts failing.

## Maybe later
- **Women's leagues we can't track yet** – find a free data source for Damallsvenskan,
  Toppserien, Serie A Femminile and Kvindeligaen (many Helmarit players are there).
- **More men's leagues** – Poland (Håkans) and Czechia (Mahuta) are missing from the data
  source; look for another free source, or check if more leagues have been added.
- **WSL broadcaster in Finland** – not confirmed yet; check Viaplay / Disney+ / others.
- **Transfer windows** – rebuild the player list daily in January and summer instead of weekly.
- **Further-ahead fixtures** – show or add to calendar matches beyond 7 days
  (e.g. each followed player's club schedule).
- **Calendar subscription per player** – a calendar link that updates by itself.
- **Player page** – one player's recent matches, goals and next games.
- **Link preview picture** (`og:image`) – the GitHub workflow draws a picture of the week 4× a day, so links
  pasted into WhatsApp show it too. Needs a way to draw images in Python without extra libraries.
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
