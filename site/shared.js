// Code shared by every page of Finn for the Win.

// ---------------------------------------------------------------------------
// Keeping visitors up to date.
//   When the site is published, the GitHub job replaces __VERSION__ in every
//   page and file with the code version (e.g. "a1b2c3d"). So after an update
//   the files get new addresses (style.css?v=a1b2c3d), and a browser can't
//   mix a new page with an old saved copy of a file.
//   It also publishes version.json. When a visitor comes back to a tab left
//   open, we compare: a new site version reloads the page; otherwise we just
//   fetch the latest match data.
// ---------------------------------------------------------------------------
const SITE_VERSION = "__VERSION__";
const STAMPED = !SITE_VERSION.startsWith("__");   // false when testing on a computer
const CHECK_EVERY_MINUTES = 15;

function keepUpToDate(refreshData) {
  let lastCheck = Date.now();
  async function check() {
    lastCheck = Date.now();
    try {
      const r = await fetch("version.json", { cache: "no-cache" });
      if (r.ok && STAMPED) {
        const published = (await r.json()).version;
        if (published && published !== SITE_VERSION) {
          location.reload();   // the site itself changed: load the new version
          return;
        }
      }
    } catch {}
    refreshData();             // same site version: just get the latest data
  }
  // When the visitor comes back to the tab (or switches back to the browser)...
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastCheck > 60000) check();
  });
  // ...and every 15 minutes while the page stays open on screen.
  setInterval(() => { if (document.visibilityState === "visible") check(); }, CHECK_EVERY_MINUTES * 60000);
}

// Make an element, e.g. el("span", "name", "Ville Koski").
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// ---------------------------------------------------------------------------
// Language.
//   All texts live in texts.js. The site starts in Finnish if the visitor's
//   phone or browser is set to Finnish, otherwise in English. A choice made
//   with the FI / EN switch is remembered on the device, like favourites.
// ---------------------------------------------------------------------------
const LANGUAGE_KEY = "finnftw-language";
let lang = pickLanguage();

function pickLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === "fi" || saved === "en") return saved;
  } catch {}
  const browser = navigator.languages || [navigator.language || ""];
  return browser.some(l => l.toLowerCase().startsWith("fi")) ? "fi" : "en";
}

// t("watch") -> "Katso:"; t("matches", 5) -> "5 ottelua"
function t(key, ...args) {
  const text = TEXTS[lang][key];
  return typeof text === "function" ? text(...args) : text;
}

// Fill in the texts written straight into the HTML, marked like
// <p data-t="footer">, data-t-placeholder="search" or data-t-label="chooseDay".
function applyStaticTexts() {
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-t]").forEach(n => n.textContent = t(n.dataset.t));
  document.querySelectorAll("[data-t-placeholder]").forEach(n => n.placeholder = t(n.dataset.tPlaceholder));
  document.querySelectorAll("[data-t-label]").forEach(n => n.setAttribute("aria-label", t(n.dataset.tLabel)));
  if (document.body.dataset.title) document.title = t(document.body.dataset.title);
}

// The FI / EN switch. `redraw` is the page's own function that draws its content.
function setUpLanguageSwitch(redraw) {
  const box = document.getElementById("lang");
  const draw = () => {
    box.replaceChildren();
    box.setAttribute("aria-label", t("langLabel"));
    for (const code of ["fi", "en"]) {
      const b = el("button", null, code.toUpperCase());
      b.type = "button";
      b.lang = code;
      b.setAttribute("aria-pressed", String(code === lang));
      b.addEventListener("click", () => {
        lang = code;
        try { localStorage.setItem(LANGUAGE_KEY, code); } catch {}
        applyStaticTexts();
        draw();
        redraw();
      });
      box.append(b);
    }
  };
  applyStaticTexts();
  draw();
}

// Dates and times the local way: Finnish "la 21.11." and "19.30",
// English "Sat 21.11." and "19:30".
function weekdayName(date) {
  return date.toLocaleDateString(lang === "fi" ? "fi-FI" : "en-GB", { weekday: "short" });
}
function shortDateYear(isoDay) {
  const [y, m, d] = isoDay.split("-").map(Number);
  return d + "." + m + "." + y;
}
function clockTime(hhmm) {
  return lang === "fi" ? hhmm.replace(":", ".") : hhmm;
}
function updatedText(isoTime) {
  const time = new Date(isoTime).toLocaleString(lang === "fi" ? "fi-FI" : "en-GB",
    { timeZone: "Europe/Helsinki", dateStyle: "short", timeStyle: "short" });
  return t("updated", time);
}

// ---------------------------------------------------------------------------
// Men / Women / All switch. Remembered on the device, like the language.
// ---------------------------------------------------------------------------
const GENDER_KEY = "finnftw-gender";
let gender = loadGender();   // "all", "men" or "women"

function loadGender() {
  try {
    const saved = localStorage.getItem(GENDER_KEY);
    if (["all", "men", "women"].includes(saved)) return saved;
  } catch {}
  return "all";
}

// Should this match (or league) be shown with the current choice?
function showsGender(isWomen) {
  return gender === "all" || (gender === "women") === Boolean(isWomen);
}

function setUpGenderSwitch(redraw) {
  const box = document.getElementById("gender");
  const draw = () => {
    box.replaceChildren();
    box.setAttribute("aria-label", t("genderLabel"));
    for (const [value, key] of [["men", "genderMen"], ["women", "genderWomen"], ["all", "genderAll"]]) {
      const b = el("button", null, t(key));
      b.type = "button";
      b.setAttribute("aria-pressed", String(value === gender));
      b.addEventListener("click", () => {
        gender = value;
        try { localStorage.setItem(GENDER_KEY, value); } catch {}
        draw();
        redraw();
      });
      box.append(b);
    }
  };
  draw();
  return draw;   // the page calls this again when the language changes
}

// Finland's side in a national team match: the men's team (458) or Helmarit (7536).
const FINLAND_TEAM_IDS = ["458", "7536"];
function finlandSide(m) {
  return FINLAND_TEAM_IDS.includes(m.home.id) ? m.home : m.away;
}
function nationalTeamName(isWomen) {
  return t(isWomen ? "nationalTeamWomen" : "nationalTeam");
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
  btn.setAttribute("aria-label", on ? t("stopFollowing", name) : t("follow", name));
  btn.title = on ? t("followingTitle") : t("followTitle");
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
  if (finns.length && !m.national_team) lines.push(t("calFinns") + finns.join(", "));
  if (m.watch) lines.push(t("calWatch") + m.watch.service + (m.watch.url ? " " + m.watch.url : ""));
  lines.push(t("calFrom") + location.origin + location.pathname.replace(/[^/]*$/, ""));
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
