"""
find_finns.py — finds matches with Finnish players and saves them to a file.

Run it from the Terminal, inside the finns-today folder:

    python3 find_finns.py               # 3 days back to 7 days ahead of today
    python3 find_finns.py 2026-11-08    # the same, around a chosen date (for testing)

What it does, step by step:
  1. Make a list of Finnish players: look through every squad in our leagues
     and keep players whose citizenship is "Finland". Squads change slowly,
     so the list is saved and only rebuilt once a week.
  2. Fetch every match in our leagues for the chosen days, and keep only
     the matches where a team has a Finn in its squad.
  3. For matches that have started or finished, check the lineups:
     did each Finn start, come on as a sub, or stay on the bench?
  4. Save the result as data/matches.json, which the website will read later.
  5. Add finished matches to data/history.json, which the website's weekly
     summary reads. The history survives between runs: before each run, the
     automatic GitHub job downloads the published copy from the live site.
"""

import json
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import espn

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

# League codes ESPN uses. "esp.1" = Spain's top division, "esp.2" = second, etc.
# New league or cup? Also add its Finnish name to LEAGUE_NAMES_FI in site/texts.js.
DOMESTIC_LEAGUES = [
    "eng.1", "eng.2", "eng.3", "eng.4",   # England
    "esp.1", "esp.2",                     # Spain
    "ger.1", "ger.2",                     # Germany
    "ita.1", "ita.2",                     # Italy
    "fra.1", "fra.2",                     # France
    "ned.1", "ned.2",                     # Netherlands
    "bel.1", "por.1", "sco.1", "sco.2",   # Belgium, Portugal, Scotland
    "tur.1", "gre.1", "aut.1", "sui.1",   # Turkey, Greece, Austria, Switzerland
    "den.1", "nor.1", "swe.1",            # Denmark, Norway, Sweden
    "usa.1", "usa.usl.1",                 # USA (MLS + USL Championship)
    "ksa.1", "jpn.1", "aus.1",            # Saudi Arabia, Japan, Australia
]
# European cups. We don't scan their squads: the clubs in them are already
# covered by the domestic leagues above (a club has the same ID everywhere).
CUPS = ["uefa.champions", "uefa.europa", "uefa.europa.conf"]

# Competitions Finland's men's national team plays in, and its ESPN team ID.
NATIONAL_TEAM_COMPS = [
    "uefa.nations",       # Nations League
    "fifa.worldq.uefa",   # World Cup qualifiers
    "uefa.euroq",         # European Championship qualifiers
    "fifa.world",         # World Cup
    "uefa.euro",          # European Championship
    "fifa.friendly",      # Friendlies
]
FINLAND_TEAM_ID = "458"

# Players who play for Finland but whom the data source lists under another
# citizenship. Add a player's ID here (the number in their ESPN address) and
# they're treated as Finnish. Tip: the website's "Played for Finland, not
# followed yet" list shows national team players the script didn't find.
EXTRA_FINNS = {
    "221227": "Fredrik Oldrup Jensen",   # listed as Norway (2026-11-18)
}

# Finnish clubs are recognised by their code starting with "fin.", e.g.
# "fin.fc_inter_turku". A few clubs' codes don't, so they're listed here by ID.
# National team players at these clubs aren't shown as "not followed yet".
FINNISH_CLUBS_WITHOUT_CODE = {
    "133594": "IF Gnistan Helsinki",
}

# Women's football. The data source has fewer women's leagues: Sweden,
# Germany, Italy, Norway and Denmark are missing (checked 2026-11-18).
WOMEN_LEAGUES = [
    "eng.w.1",                            # England: Women's Super League
    "esp.w.1", "fra.w.1", "ned.w.1",      # Spain, France, Netherlands
    "usa.nwsl", "usa.w.usl.1",            # USA: NWSL + USL Super League
    "can.w.nsl", "aus.w.1", "mex.w.1",    # Canada, Australia, Mexico
]
WOMEN_CUPS = ["uefa.wchampions"]
WOMEN_NATIONAL_TEAM_COMPS = [
    "fifa.wworldq.uefa",  # World Cup qualifiers
    "uefa.w.nations",     # Nations League
    "uefa.weuro",         # European Championship
    "fifa.wwc",           # World Cup
    "fifa.friendly.w",    # Friendlies
]
FINLAND_WOMEN_TEAM_ID = "7536"   # Helmarit

ALL_LEAGUES = DOMESTIC_LEAGUES + WOMEN_LEAGUES          # squads we scan for Finns
WOMEN_COMPETITIONS = set(WOMEN_LEAGUES + WOMEN_CUPS + WOMEN_NATIONAL_TEAM_COMPS)
FINLAND_TEAM_IDS = {FINLAND_TEAM_ID, FINLAND_WOMEN_TEAM_ID}

DAYS_BEFORE = 3            # how many past days to include (for final scores)
DAYS_AFTER = 7             # how many days ahead to include (upcoming matches)
PLAYER_LIST_MAX_AGE = 7    # days before the Finnish player list is rebuilt
PARALLEL_REQUESTS = 6      # how many requests to ESPN we make at the same time

DATA_DIR = Path(__file__).parent / "data"
STREAMING_FILE = Path(__file__).parent / "streaming_fi.json"   # edited by hand
PLAYERS_FILE = DATA_DIR / "finnish_players.json"
MATCHES_FILE = DATA_DIR / "matches.json"
PLAYERS_PAGE_FILE = DATA_DIR / "players.json"   # read by the website's "All Finns" page
HISTORY_FILE = DATA_DIR / "history.json"         # finished matches, for the weekly summary
HISTORY_DAYS = 7           # the weekly summary covers this many past days
HISTORY_KEEP = 14          # days of history kept in the file (older ones are dropped)
HISTORY_VERSION = 2        # raise this when the history's contents change; it's then rebuilt
                           # (2 = women's football added)


# ---------------------------------------------------------------------------
# Finnish time
# ---------------------------------------------------------------------------

def finnish_time(utc_time):
    """Convert a UTC time to Finnish time.

    Finland is UTC+2 in winter and UTC+3 in summer. Summer time runs from
    the last Sunday of March to the last Sunday of October (changing at
    01:00 UTC), like everywhere in the EU.
    """
    def last_sunday(year, month):
        day = date(year, month + 1, 1) - timedelta(days=1)   # last day of month
        return day - timedelta(days=(day.weekday() + 1) % 7)  # step back to Sunday

    year = utc_time.year
    summer_start = datetime.combine(last_sunday(year, 3), datetime.min.time(), timezone.utc) + timedelta(hours=1)
    summer_end = datetime.combine(last_sunday(year, 10), datetime.min.time(), timezone.utc) + timedelta(hours=1)
    offset = 3 if summer_start <= utc_time < summer_end else 2
    return utc_time + timedelta(hours=offset)


def parse_utc(text):
    """Turn ESPN's time text, e.g. "2025-10-19T12:00Z", into a Python datetime."""
    return datetime.strptime(text, "%Y-%m-%dT%H:%MZ").replace(tzinfo=timezone.utc)


# ---------------------------------------------------------------------------
# Step 1: the list of Finnish players
# ---------------------------------------------------------------------------

def load_finnish_players():
    """Return the saved player list, or rebuild it if missing or too old."""
    if PLAYERS_FILE.exists():
        saved = json.loads(PLAYERS_FILE.read_text())
        age = datetime.now(timezone.utc) - datetime.fromisoformat(saved["updated"])
        # (A list saved before women's leagues were added is rebuilt.)
        if age.days < PLAYER_LIST_MAX_AGE and "teams" in saved and all("women" in p for p in saved["players"]):
            print(f"Using saved list of {len(saved['players'])} Finnish players.")
            return saved["players"], saved["teams"]

    print("Building the list of Finnish players (checks every squad, takes a minute)...")
    # First every team in every league...
    teams = []
    for league in ALL_LEAGUES:
        for team in espn.league_teams(league):
            teams.append((league, team))

    # ...then every squad. This is ~550 requests, so we run several at once.
    def finns_in_squad(league_and_team):
        league, team = league_and_team
        squad = espn.team_squad(league, team["id"])
        return [
            {"id": p["id"], "name": p["name"], "team_id": team["id"],
             "team_name": team["name"], "league": league,
             "women": league in WOMEN_COMPETITIONS}
            for p in squad if p["citizenship"] == "Finland" or p["id"] in EXTRA_FINNS
        ]

    players = []
    with ThreadPoolExecutor(PARALLEL_REQUESTS) as pool:
        for finns in pool.map(finns_in_squad, teams):
            players.extend(finns)

    DATA_DIR.mkdir(exist_ok=True)
    # Also keep every team we scanned (team ID -> league and name), so a club
    # can be recognised later even if no Finn is in its squad list.
    team_table = {team["id"]: {"league": league, "name": team["name"]} for league, team in teams}
    PLAYERS_FILE.write_text(json.dumps(
        {"updated": datetime.now(timezone.utc).isoformat(), "players": players, "teams": team_table},
        ensure_ascii=False, indent=2))
    print(f"Found {len(players)} Finnish players in {len(teams)} squads.")
    return players, team_table


def check_national_team_players(players, teams, history):
    """Players who played for Finland (in the saved history) but aren't in
    our list. Squad lists sometimes miss a player (e.g. Leo Walta at LAFC in
    2026), so we look up each one's club directly:
      - club in a league we follow -> add the player to the list
      - club in Finland            -> skip (Finnish leagues are out of scope)
      - club anywhere else         -> remember as "not followed" for the website
    """
    known = {p["id"] for p in players}
    seen = {}
    for m in history["matches"]:
        if m["national_team"]:
            for side in ("home", "away"):
                if m[side]["id"] in FINLAND_TEAM_IDS:
                    for f in m[side]["finns"]:
                        if f["id"] not in known:
                            seen[f["id"]] = (f["name"], m.get("women", False))
    added, not_followed = [], []
    for pid, (name, women) in seen.items():
        try:
            club = espn.player_club(pid)
        except Exception:
            continue   # lookup failed: try again on the next run
        if club["id"] in teams:
            team = teams[club["id"]]
            added.append({"id": pid, "name": name, "team_id": club["id"], "team_name": team["name"],
                          "league": team["league"], "women": team["league"] in WOMEN_COMPETITIONS})
        elif not (club["slug"].startswith("fin.") or club["id"] in FINNISH_CLUBS_WITHOUT_CODE):
            not_followed.append({"id": pid, "name": name, "club": club["name"], "women": women})
    if added:
        print("Added from national team lineups: " + ", ".join(p["name"] for p in added))
    return players + added, not_followed


# ---------------------------------------------------------------------------
# Steps 2 and 3: the matches
# ---------------------------------------------------------------------------

def find_matches(players, finnish_days):
    # A quick lookup table: team ID -> the Finns in that team.
    finns_by_team = {}
    for p in players:
        finns_by_team.setdefault(p["team_id"], []).append(p)

    # ESPN's days follow US time, so to cover a full Finnish day we also
    # need the US day before it (late US evening = next morning in Finland).
    espn_days = [finnish_days[0] - timedelta(days=1)] + finnish_days
    competitions = (DOMESTIC_LEAGUES + CUPS + NATIONAL_TEAM_COMPS
                    + WOMEN_LEAGUES + WOMEN_CUPS + WOMEN_NATIONAL_TEAM_COMPS)
    requests = [(lg, d) for lg in competitions for d in espn_days]
    print(f"Checking {len(requests)} league schedules...")

    with ThreadPoolExecutor(PARALLEL_REQUESTS) as pool:
        results = pool.map(lambda r: espn.matches_on(*r), requests)
        all_matches = [m for day_matches in results for m in day_matches]

    found = {}
    for m in all_matches:
        kickoff_fi = finnish_time(parse_utc(m["kickoff_utc"]))
        if kickoff_fi.date() not in finnish_days:
            continue
        team_ids = (m["home"]["id"], m["away"]["id"])
        m["national_team"] = any(t in FINLAND_TEAM_IDS for t in team_ids)
        m["women"] = m["league"] in WOMEN_COMPETITIONS
        if not m["national_team"] and not any(t in finns_by_team for t in team_ids):
            continue
        m["date_fi"] = kickoff_fi.strftime("%Y-%m-%d")
        m["kickoff_fi"] = kickoff_fi.strftime("%H:%M")
        for side in ("home", "away"):
            # For club matches: the Finns from our player list.
            # For Finland's own matches this starts empty; the lineup fills it in.
            m[side]["finns"] = [
                {"id": p["id"], "name": p["name"], "role": None}
                for p in finns_by_team.get(m[side]["id"], [])
            ]
        found[m["id"]] = m      # keyed by ID, so a match is never listed twice

    # Step 3: lineups, for matches that have started or finished.
    def add_lineups(m):
        if m["state"] == "pre":
            return
        lineup = espn.match_lineups(m["league"], m["id"])
        for side in ("home", "away"):
            if m[side]["id"] in FINLAND_TEAM_IDS:
                # National team: list everyone who played for Finland.
                m[side]["finns"] = [
                    {"id": pid, "name": p["name"], "role": p["role"]}
                    for pid, p in lineup.items()
                    if p["team_id"] == m[side]["id"] and p["role"] != "unused sub"
                ]
            else:
                for finn in m[side]["finns"]:
                    finn["role"] = lineup.get(finn["id"], {}).get("role", "not in squad")
            # Copy goals, assists and own goals onto each Finn who has them.
            for finn in m[side]["finns"]:
                for key in ("goals", "assists", "own_goals"):
                    if key in lineup.get(finn["id"], {}):
                        finn[key] = lineup[finn["id"]][key]

    with ThreadPoolExecutor(PARALLEL_REQUESTS) as pool:
        list(pool.map(add_lineups, found.values()))

    return sorted(found.values(), key=lambda m: m["kickoff_utc"])


# ---------------------------------------------------------------------------
# Step 4: where to watch in Finland
# ---------------------------------------------------------------------------

def add_streaming_info(matches):
    """Look up each match's competition in our hand-made streaming table.

    This is a "join": the league code (e.g. "esp.1") from ESPN's data is
    matched against the same code in streaming_fi.json.
    """
    table = json.loads(STREAMING_FILE.read_text())
    for m in matches:
        if m["national_team"]:
            key = "finland_women_national_team" if m["women"] else "finland_national_team"
            m["watch"] = table.get(key)
        else:
            m["watch"] = table["competitions"].get(m["league"])   # None if unknown


def save_player_page_data(players, not_followed):
    """Save the player list for the website's "All Finns" page, grouped by
    league in the same order as ALL_LEAGUES (England first, and so on)."""
    codes = sorted({p["league"] for p in players},
                   key=lambda lg: ALL_LEAGUES.index(lg) if lg in ALL_LEAGUES else 99)
    with ThreadPoolExecutor(PARALLEL_REQUESTS) as pool:
        names = dict(zip(codes, pool.map(espn.league_name, codes)))
    leagues = []
    for code in codes:
        in_league = sorted((p for p in players if p["league"] == code),
                           key=lambda p: (p["team_name"], p["name"]))
        leagues.append({
            "league": code,
            "name": names[code],
            "women": code in WOMEN_COMPETITIONS,
            "players": [{"id": p["id"], "name": p["name"], "club": p["team_name"]} for p in in_league],
        })
    PLAYERS_PAGE_FILE.write_text(json.dumps(
        {"generated": datetime.now(timezone.utc).isoformat(), "leagues": leagues,
         "national_team_not_followed": not_followed},
        ensure_ascii=False, indent=2))


# ---------------------------------------------------------------------------
# Step 5: the match history, for the weekly summary
# ---------------------------------------------------------------------------

def load_history():
    """The saved history, or an empty one. "days_covered" lists the past days
    whose matches are already in it, so we know which days still need fetching."""
    if HISTORY_FILE.exists():
        try:
            saved = json.loads(HISTORY_FILE.read_text())
            if saved.get("version") == HISTORY_VERSION:
                return saved
        except ValueError:
            pass   # a damaged file: start again
    return {"version": HISTORY_VERSION, "days_covered": [], "matches": []}


def update_history(history, matches, fetched_days, today):
    """Add finished matches, mark fully past days as covered, drop old ones."""
    by_id = {m["id"]: m for m in history["matches"]}
    for m in matches:
        if m["state"] == "post":
            by_id[m["id"]] = {k: m[k] for k in (
                "id", "league", "league_name", "national_team", "women", "date_fi", "kickoff_fi", "home", "away")}
    covered = set(history["days_covered"]) | {d.isoformat() for d in fetched_days if d < today}
    oldest = (today - timedelta(days=HISTORY_KEEP)).isoformat()
    history["days_covered"] = sorted(d for d in covered if d >= oldest)
    history["matches"] = sorted((m for m in by_id.values() if m["date_fi"] >= oldest),
                                key=lambda m: (m["date_fi"], m["kickoff_fi"]))
    history["generated"] = datetime.now(timezone.utc).isoformat()
    HISTORY_FILE.write_text(json.dumps(history, ensure_ascii=False, indent=2))


# ---------------------------------------------------------------------------
# Putting it together
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) > 1:
        center = date.fromisoformat(sys.argv[1])
    else:
        center = finnish_time(datetime.now(timezone.utc)).date()
    days = [center + timedelta(days=n) for n in range(-DAYS_BEFORE, DAYS_AFTER + 1)]

    players, teams = load_finnish_players()

    # Past days missing from the history (e.g. on the very first run) are
    # fetched too, so the weekly summary is complete. Normally none are.
    history = load_history()
    players, not_followed = check_national_team_players(players, teams, history)
    missing = [center - timedelta(days=n) for n in range(1, HISTORY_DAYS + 1)
               if (center - timedelta(days=n)).isoformat() not in history["days_covered"]]
    start = min([days[0]] + missing)
    fetch_days = [start + timedelta(days=n) for n in range((days[-1] - start).days + 1)]
    if missing:
        print(f"Also fetching {len(missing)} past day(s) for the weekly summary.")

    fetched = find_matches(players, fetch_days)
    window = {d.isoformat() for d in days}
    matches = [m for m in fetched if m["date_fi"] in window]
    add_streaming_info(matches)

    DATA_DIR.mkdir(exist_ok=True)
    MATCHES_FILE.write_text(json.dumps(
        {"generated": datetime.now(timezone.utc).isoformat(),
         "days": [d.isoformat() for d in days],
         "matches": matches},
        ensure_ascii=False, indent=2))
    save_player_page_data(players, not_followed)
    update_history(history, fetched, fetch_days, center)

    # Print a readable summary in the Terminal.
    print(f"\n{len(matches)} matches with Finns, {days[0]} to {days[-1]} (Finnish time):")
    current_day = None
    for m in matches:
        if m["date_fi"] != current_day:
            current_day = m["date_fi"]
            print(f"\n  {current_day}")
        score = f"{m['home']['score']}-{m['away']['score']}" if m["state"] != "pre" else "vs"
        print(f"    {m['kickoff_fi']}  {m['home']['name']} {score} {m['away']['name']}  ({m['league_name']})")
        watch = m["watch"]
        if watch:
            print(f"           Watch: {watch['service']}{' (free)' if watch['free'] else ''}")
        else:
            print("           Watch: no known Finnish broadcaster")
        for side in ("home", "away"):
            for finn in m[side]["finns"]:
                role = f" — {finn['role']}" if finn["role"] else ""
                extras = ""
                if finn.get("goals"):
                    extras += f", goals {' '.join(finn['goals'])}"
                if finn.get("assists"):
                    extras += f", assists {finn['assists']}"
                if finn.get("own_goals"):
                    extras += f", own goals {finn['own_goals']}"
                print(f"           {finn['name']} ({m[side]['name']}){role}{extras}")
    print(f"\nSaved to {MATCHES_FILE}")


if __name__ == "__main__":
    main()
