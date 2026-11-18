"""
espn.py — everything that talks to ESPN lives in this one file.

Why a separate file?  ESPN's data feeds are unofficial and could change.
If that ever happens, or if we switch to another data source, this is the
only file we need to rewrite. The rest of the program just calls the
functions below and doesn't care where the data comes from.

How it works: each function builds a web address (URL), asks ESPN for it,
and gets back JSON — text data with labelled values, like
    {"displayName": "Ville Koski", "citizenship": "Finland"}
Python turns that JSON into dictionaries and lists we can work with.
"""

import json
import time
import urllib.request

BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/soccer/"


def get_json(url, retries=3):
    """Download one URL and return its JSON as Python data.

    If ESPN doesn't answer (network hiccup), wait a moment and try again.
    """
    request = urllib.request.Request(url, headers={"User-Agent": "finns-today/0.1"})
    for attempt in range(1, retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                return json.load(response)
        except Exception:
            if attempt == retries:
                raise
            time.sleep(2 * attempt)  # wait 2s, then 4s, before retrying


def league_teams(league):
    """All teams in a league, e.g. league="esp.1" (LaLiga).

    Returns a list like [{"id": "96", "name": "Alavés"}, ...]
    """
    data = get_json(BASE_URL + league + "/teams")
    teams = data["sports"][0]["leagues"][0]["teams"]
    return [{"id": t["team"]["id"], "name": t["team"]["displayName"]} for t in teams]


def player_club(player_id):
    """A player's current club, looked up from the player's own page, e.g.
        {"id": "18966", "name": "LAFC", "slug": "usa.lafc"}
    The slug starts with the club's country ("fin." = a Finnish club).
    Useful when a club's squad list is missing a player."""
    data = get_json(f"https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/{player_id}")
    team = data.get("athlete", {}).get("team") or {}
    return {"id": team.get("id"), "name": team.get("displayName"), "slug": team.get("slug") or ""}


def team_squad(league, team_id):
    """The players in one team's squad, with their citizenship."""
    data = get_json(f"{BASE_URL}{league}/teams/{team_id}/roster")
    return [
        {"id": p["id"], "name": p["displayName"], "citizenship": p.get("citizenship")}
        for p in data.get("athletes", [])
    ]


def matches_on(league, day):
    """All matches in a league on one day. `day` is a date like 2025-10-19.

    Note: ESPN's "day" follows US time, so late-evening US matches show up
    on the next morning in Finland. The main script deals with that.
    """
    data = get_json(f"{BASE_URL}{league}/scoreboard?dates={day:%Y%m%d}")
    league_name = data["leagues"][0]["name"] if data.get("leagues") else league
    matches = []
    for event in data.get("events", []):
        comp = event["competitions"][0]
        teams = {}
        for c in comp["competitors"]:
            teams[c["homeAway"]] = {
                "id": c["team"]["id"],
                "name": c["team"]["displayName"],
                "score": c.get("score"),
            }
        matches.append({
            "id": event["id"],
            "league": league,
            "league_name": league_name,
            "kickoff_utc": event["date"],                      # e.g. "2025-10-19T12:00Z"
            "state": comp["status"]["type"]["state"],          # "pre", "in" or "post"
            "status_text": comp["status"]["type"]["description"],  # e.g. "Full Time"
            "home": teams["home"],
            "away": teams["away"],
        })
    return matches


def league_name(league):
    """The league's readable name, e.g. "eng.2" -> "English League Championship"."""
    data = get_json(f"{BASE_URL}{league}/scoreboard")
    return data["leagues"][0]["name"] if data.get("leagues") else league


def match_lineups(league, match_id):
    """Who was in the matchday squads. Returns {player_id: {...}}, e.g.
        {"12345": {"name": "Ville Koski", "team_id": "96", "role": "started"}}

    role is one of: "started", "came on", "unused sub".
    Players not in the matchday squad at all are simply missing.
    Lineups usually appear about an hour before kickoff.

    Players who scored also get "goals" (minutes, e.g. ["57'", "90'+2' pen"]),
    and "assists" and "own_goals" (counts) when above zero. Assist data is
    missing for some matches, so a missing assist doesn't prove there wasn't one.
    """
    data = get_json(f"{BASE_URL}{league}/summary?event={match_id}")
    players = {}
    for team in data.get("rosters", []):
        for p in team.get("roster", []):
            if p.get("starter"):
                role = "started"
            elif p.get("subbedIn"):
                role = "came on"
            else:
                role = "unused sub"
            player = {
                "name": p["athlete"]["displayName"],
                "team_id": team["team"]["id"],
                "role": role,
            }
            # Goal minutes come from the player's "plays" (key moments).
            goals = []
            for play in p.get("plays", []):
                if play.get("didScore") and not play.get("ownGoal"):
                    minute = play.get("clock", {}).get("displayValue", "")
                    goals.append(minute + (" pen" if play.get("penaltyKick") else ""))
            if goals:
                player["goals"] = goals
            # Assists and own goals come from the player's match statistics.
            stats = {s.get("name"): s.get("value") for s in p.get("stats", [])}
            for stat, key in (("goalAssists", "assists"), ("ownGoals", "own_goals")):
                count = int(stats.get(stat) or 0)
                if count:
                    player[key] = count
            players[p["athlete"]["id"]] = player
    return players
