# Ideas

A running list. Pick one per session; move it to **Done** when it's live.
Write ideas down as soon as they come up, even half-formed ones.

## Next
Before sharing the site with the football team parents (stage 1 in `VISION.md`), in this order:
- **Add goslkeepers to the 'This Werk' page** - For example, Hradecky played for AS Monaco in their win on Nov. 26. It should me noted in the recap.  
- **Add international matches for Finnish clubs to the schedule** - We missed, for example, Braga vs KuPS on Nov. 26, 2026. in addition to away matches abroad, we shouod kist their home matches. We do not add players who play in tge domestic league to the tracking. 
- **Follow Finns in specific lesgues** – As a user, I wabt to follow mayches wirh Finns playing in specific leagues. I might be interested in some leavues more than others, or I may not be interested in knowing about matches in leagues I have no wat of streaming. 
- **Ask friends and the football team parents** – share the link, then a short anonymous survey in Finnish.

Dated:
- **Re-check Women's Europa Cup streaming in January** – UEFA.tv for Finland, before the quarter-finals
  on 3 and 10 Feb 2027. If confirmed, set `uefa.w.europa` to official with a link in `streaming_fi.json`.

## On the back burner
- **Rename to "Finns for the Win" and get our own address** – name decided 2026-11-26. Waiting until the site
  has had more work. Then buy the domain (finnsforthewin.fi/.com and finnsftw.fi/.com were free on 2026-11-26),
  connect it to GitHub Pages, and change the name on the site (titles, `texts.js`, share pictures).
  Ideally done before the link goes to the football team parents, so shared links don't change later.

## Maybe later
- **Research wats to make the site more fun and interesting** - What would be feasible ways to add a hit of storytelling to the site. What is the anticipation for a match. Did the result go as expected? who were the Finnish heroes?
- **Allow users to show interest in leagues not streamable in Finland** – It might be useful information for broadcasters and streaming sites to know how much demand there is for viewing mayches not covered by their rights currently. Though we have little power to impact this, it can tell us which leagues to focus on when looking for international streaming alternatives. For example, DAZN may show some leagues and is a legal option. 
- **Share a single match or player** – e.g. "Pohjanpalo scored twice" as its own picture.
- **Player page** – one player's recent matches, goals and next games. When clicking on a players name, a page opens, shows the players name, team, position, result of last match and next match, link to add next match to my calendar and subscribe to players calendar.
- **Comical player caricatures** – We most likely cannot pull images of players from some site due to copyright reasons. We can find images of players, at least most likely. It would be big job, but we could create caricatures of all players. We would need a system that notifies us when a new player is added to the site, and reminds us to create a caricature. Before that image has been created, or if a picture doesn't exist and we cannot create it, we could have default male and female caricatures for different positions. This idea requires a cost-benefit analysis. We don't know yet how many tokens a single image would require. 
- **Women's leagues we can't track yet** – find a free data source for Damallsvenskan,
  Toppserien, Serie A Femminile and Kvindeligaen (many Helmarit players are there). Checked 2026-11-25:
  none are in ESPN, and only WSL 2 (England) is clearly free to watch in Finland (league's YouTube).
- **Notifications** ("your player is in the starting lineup") – needs a server or push
  service; a bigger learning project.
- **User accounts** – favourites on all devices; mainly as a learning exercise.
- **Accuracy check** – after each run, an automatic report of oddities (a Finn vanished, a club changed,
  a streaming entry not checked this season, data source errors). Needed before stage 2.
- **Licensed data source** – before showing the site to strangers. API-Football is a candidate: first check
  on its free tier whether it can find players by nationality as easily as ESPN.
- **Other sports ("Finns for the Win")** – ice hockey first (most Finns abroad, biggest audience),
  then maybe basketball, F1, American football. Each sport needs its own streaming table and data checks.
- **Finns in US college sports on Disney+** – Miikka Muurinen (college basketball) can be watched on Disney+
  in Finland, which also shows college American football and maybe college soccer. Are there Finns in
  college soccer, and which matches does Disney+ show in Finland?

## Decided against
- **Poland and Czechia (Håkans, Mahuta)** – checked 2026-11-25; they stay under "Not tracked yet".
  - ESPN still has no Polish league, and the Czech one has no teams or matches. Romania and Cyprus
    have squad lists but no matches since 2025 / spring 2026, so they're no use either.
  - TheSportsDB (free key `123`) has both leagues with times and scores, but no lineups or goals.
    Day lists are capped at 3 matches (whole rounds via `eventsround.php` work). Its terms allow free
    use only for "development projects", which may not cover a public site.
  - Czechia: no legal way to watch in Finland found (Oneplay in Czechia, Betano = betting).
    Poland: Ekstraklasa.TV (the league's own service) streams worldwide except PL/BY/RU.
  - Revisit if ESPN adds the leagues, or a Finnish broadcaster picks them up.

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
- Women's Europa Cup: its squads are scanned, so Finns at Brann, Hammarby and Brøndby show up for cup matches
  (streaming on UEFA.tv still unconfirmed for 2026/27).
- Phone first impression, part 1: match cards about 30% shorter on phones (teams on one line, a short
  "Lineup not out yet" line instead of a long sentence, club names only when both teams have Finns), and the
  match of the day banner names the Finn(s) as its headline.
- Phone first impression, part 2: no "Watch:" on finished matches, and the fonts come from our own site
  (`site/fonts/`) instead of Google Fonts, so visitors' browsers no longer contact Google. (The star tip
  already disappeared once a player is starred, so it needed no change.)
