// Code shared by every page of Finn for the Win.

// Make an element, e.g. el("span", "name", "Ville Koski").
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// Today's date in Finland, whatever time zone the visitor is in.
function todayInFinland() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date());
}

// ---------------------------------------------------------------------------
// Favourite players.
//   Stored in the browser's "local storage": a small notebook each website
//   gets on each device. Nothing is sent anywhere, so favourites stay on
//   this phone or computer only. Every page of the site shares the same
//   notebook. Players are saved by their ID number, so a favourite keeps
//   working when the player moves clubs.
// ---------------------------------------------------------------------------
const FAVOURITES_KEY = "finnftw-favourites";
let favourites = loadFavourites();   // e.g. { "275713": "Ilmari Niskanen" }

function loadFavourites() {
  // try/catch: some private-browsing modes refuse local storage.
  try { return JSON.parse(localStorage.getItem(FAVOURITES_KEY)) || {}; }
  catch { return {}; }
}
function saveFavourites() {
  try { localStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites)); } catch {}
}
function isFavourite(id) { return Object.prototype.hasOwnProperty.call(favourites, id); }

// Follow or unfollow a player, save, and update every star for them on the page.
function flipFavourite(id, name) {
  if (isFavourite(id)) delete favourites[id]; else favourites[id] = name;
  saveFavourites();
  document.querySelectorAll('.star[data-player="' + id + '"]').forEach(btn => setStar(btn, id, name));
}

function setStar(btn, id, name) {
  const on = isFavourite(id);
  btn.textContent = on ? "★" : "☆";
  btn.setAttribute("aria-pressed", String(on));
  btn.setAttribute("aria-label", (on ? "Stop following " : "Follow ") + name);
  btn.title = on ? "Following" : "Follow this player";
  btn.closest(".finn")?.classList.toggle("is-fav", on);
}

// A star button. `afterChange` lets each page react, e.g. redraw a filter.
function starButton(id, name, afterChange) {
  const btn = el("button", "star");
  btn.type = "button";
  btn.dataset.player = id;
  btn.addEventListener("click", () => { flipFavourite(id, name); if (afterChange) afterChange(); });
  // setStar needs the button inside its list item, so run it once it's placed.
  queueMicrotask(() => setStar(btn, id, name));
  return btn;
}

// ---------------------------------------------------------------------------
// "Spotted an error?" links.
//   Reports go to a Google Form. The link can fill in the form's first
//   question ("pre-filled"), so the visitor only writes what's wrong.
// ---------------------------------------------------------------------------
const REPORT_FORM = "https://docs.google.com/forms/d/e/1FAIpQLScvbtU5Vaj0a89T3tFMCZCJkWVmOl59chMgaz5YRGPupqtWaA/viewform";
const MATCH_FIELD = "entry.2096274022";   // the form's "Which match?" question

function reportFormUrl(label) {
  if (!label) return REPORT_FORM;
  return REPORT_FORM + "?usp=pp_url&" + MATCH_FIELD + "=" + encodeURIComponent(label);
}

// ---------------------------------------------------------------------------
// "Add to calendar".
//   Calendar apps (iPhone, Google, Outlook) all understand one simple text
//   format: iCalendar, files ending in .ics. We write that text here in the
//   browser and hand it to the visitor as a file, so nothing goes to a server.
//   Each match gets a fixed ID ("UID"), so adding the same match again
//   updates the event instead of making a copy in most calendar apps.
// ---------------------------------------------------------------------------
const MATCH_LENGTH_MINUTES = 120;   // 90 minutes + half-time + stoppage time
const REMINDER_MINUTES = 30;

// "2026-11-21T15:00Z" -> "20261121T150000Z", the format .ics files use.
function icsTime(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Commas, semicolons and line breaks have special meanings in .ics text.
function icsText(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
}

function icsEvent(m) {
  const start = new Date(m.kickoff_utc);
  const end = new Date(start.getTime() + MATCH_LENGTH_MINUTES * 60000);
  const finns = [m.home, m.away].flatMap(s => s.finns.map(f => f.name));
  const title = "⚽ " + m.home.name + " – " + m.away.name;
  const lines = [m.league_name];
  if (finns.length && !m.national_team) lines.push("Finns: " + finns.join(", "));
  if (m.watch) lines.push("Watch in Finland: " + m.watch.service + (m.watch.url ? " " + m.watch.url : ""));
  lines.push("From Finn for the Win: " + location.origin + location.pathname.replace(/[^/]*$/, ""));
  return [
    "BEGIN:VEVENT",
    "UID:" + m.id + "@finn-for-the-win",
    "DTSTAMP:" + icsTime(new Date()),
    "DTSTART:" + icsTime(start),
    "DTEND:" + icsTime(end),
    "SUMMARY:" + icsText(title),
    "DESCRIPTION:" + icsText(lines.join("\n")),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:" + icsText(title),
    "TRIGGER:-PT" + REMINDER_MINUTES + "M",
    "END:VALARM",
    "END:VEVENT",
  ];
}

// The format wants lines of at most 75 bytes; longer ones continue on the
// next line, which starts with a space ("folding").
function icsFold(line) {
  const out = [];
  let current = "", bytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    if (bytes + size > (out.length ? 74 : 75)) { out.push(current); current = ""; bytes = 0; }
    current += ch; bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

// Build a .ics file for one or more matches and offer it to the visitor.
function downloadCalendar(matchList, fileName) {
  const text = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Finn for the Win//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...matchList.flatMap(icsEvent),
    "END:VCALENDAR",
  ].map(icsFold).join("\r\n");   // the format asks for Windows-style line endings
  const file = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 10000);
}
