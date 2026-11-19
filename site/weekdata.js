// ---------------------------------------------------------------------------
// The week's numbers, used by the This week page and by preview.html (the
// hidden page that draws the link preview picture).
//
// history.json holds every finished match with Finns from the last two
// weeks, kept up to date by find_finns.py. Here we take the last 7 days and
// add the numbers up per player.
// ---------------------------------------------------------------------------
const WEEK_DAYS = 7;

// Load history.json, plus each player's club from the "All Finns" list.
// Returns { history, clubs } where clubs is a Map: player ID -> club.
async function fetchWeekData() {
  const [history, p] = await Promise.all([
    fetch("data/history.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw r; return r.json(); }),
    fetch("data/players.json", { cache: "no-cache" }).then(r => r.ok ? r.json() : { leagues: [] }),
  ]);
  const clubs = new Map();
  for (const league of p.leagues) for (const pl of league.players) clubs.set(pl.id, pl.club);
  return { history, clubs };
}

// "2026-11-18" -> the date that many days earlier, in the same format.
function daysBefore(isoDay, n) {
  const d = new Date(isoDay + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}
function shortDate(isoDay) {
  const d = new Date(isoDay + "T12:00:00");
  return weekdayName(d) + " " + d.getDate() + "." + (d.getMonth() + 1) + ".";
}

const total = list => list.reduce((n, x) => n + x.n, 0);
const byName = (a, b) => a.name.localeCompare(b.name, "fi");

// Add up the week, player by player.
function summarise(matches, clubs) {
  const players = new Map();
  for (const m of matches) {
    for (const side of [m.home, m.away]) {
      for (const f of side.finns) {
        if (!players.has(f.id)) {
          players.set(f.id, { id: f.id, name: f.name, club: null, women: m.women, started: 0, cameOn: 0,
                              bench: 0, notInSquad: 0, goals: [], assists: [] });
        }
        const p = players.get(f.id);
        if (!m.national_team) p.club = side.name;   // the club they played for this week
        if (f.role === "started") p.started++;
        else if (f.role === "came on") p.cameOn++;
        else if (f.role === "unused sub") p.bench++;
        else if (f.role === "not in squad") p.notInSquad++;
        if (f.goals) p.goals.push({ n: f.goals.length, match: m });
        if (f.assists) p.assists.push({ n: f.assists, match: m });
      }
    }
  }
  for (const p of players.values()) {
    // Players seen only in national team matches: use their club from the
    // player list, or "Finland national team" if we don't follow their club.
    if (!p.club) p.club = clubs.get(p.id) || nationalTeamName(p.women);
    p.goalCount = total(p.goals);
    p.assistCount = total(p.assists);
  }
  return [...players.values()];
}

// Everything about the last 7 days, for the current Men / Women / All choice.
function weekSummary(history, clubs) {
  const to = todayInFinland();
  const from = daysBefore(to, WEEK_DAYS - 1);   // today and the 6 days before it
  const matches = history.matches.filter(m => m.date_fi >= from && m.date_fi <= to && showsGender(m.women));
  const players = summarise(matches, clubs);
  return {
    from, to, matches, players,
    played: players.filter(p => p.started + p.cameOn > 0),
    goals: players.reduce((n, p) => n + p.goalCount, 0),
    assists: players.reduce((n, p) => n + p.assistCount, 0),
    // Goalscorers and assists, most first
    scorers: players.filter(p => p.goalCount).sort((a, b) => b.goalCount - a.goalCount || byName(a, b)),
    assisters: players.filter(p => p.assistCount).sort((a, b) => b.assistCount - a.assistCount || byName(a, b)),
  };
}
