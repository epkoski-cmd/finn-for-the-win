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
