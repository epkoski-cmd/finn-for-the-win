// ---------------------------------------------------------------------------
// "Share this week as an image" on the This week page.
//
// How it works:
//   1. We draw a picture ourselves on a <canvas>: a blank drawing area that
//      every browser has. Our code writes the texts onto it line by line,
//      like painting by numbers. No library, nothing sent to a server.
//   2. The canvas is turned into a PNG file.
//   3. On phones we open the phone's own share menu (WhatsApp, Instagram,
//      Messages…) with the file attached. That's the "Web Share API".
//      Browsers that can't share files (most computers) download it instead.
//
// The picture is 1080×1350 pixels (portrait), a size that looks good both
// in chats and in Instagram posts. Text only: no logos, photos or badges.
// ---------------------------------------------------------------------------
const SITE_ADDRESS = "epkoski-cmd.github.io/finn-for-the-win";

const CARD = {
  width: 1080, height: 1350, pad: 80,
  blue: "#1a4fa0", white: "#ffffff", soft: "#b5d4f4", line: "#4a76c0", gold: "#f0c060",
  display: '"Barlow Condensed", "Arial Narrow", sans-serif',
  body: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
};
// Heights in the player lists (pixels in the 1080×1350 picture)
const LIST_TOP = 610, LIST_BOTTOM = 1165;
const HEAD_H = 60, ROW_H = 58, MORE_H = 48, GAP_H = 26;

let shareWeek = null;     // this week's numbers, given by the page
let shareFile = null;     // the ready-made picture for those numbers
let shareFileKey = "";    // what the ready picture was made for

// The page calls this every time it draws the week.
// `week` comes from weekSummary() in weekdata.js.
function updateShare(week) {
  shareWeek = week;
  shareFile = null;
  const box = document.getElementById("share");
  const button = document.getElementById("share-btn");
  button.textContent = t("shareButton");
  document.getElementById("share-status").textContent = "";
  box.hidden = !(week && (week.scorers.length || week.assisters.length));
  // Make the picture now, so it's ready when the button is tapped. Phones
  // only open the share menu right after a tap, so there's no time to wait.
  if (!box.hidden) prepareShareFile().catch(() => {});
}

// What the picture depends on: the week, language, Men/Women/All and stars.
function shareKey() {
  return [lang, gender, JSON.stringify(favourites)].join("|");
}

async function prepareShareFile() {
  const week = shareWeek, key = shareKey();
  const file = await makeShareFile(week);
  if (week === shareWeek && key === shareKey()) { shareFile = file; shareFileKey = key; }
  return file;
}

function setUpShareButton() {
  const status = document.getElementById("share-status");
  document.getElementById("share-btn").addEventListener("click", async () => {
    status.textContent = "";
    let file = shareFile && shareFileKey === shareKey() ? shareFile : null;
    try {
      if (!file) { status.textContent = t("shareMaking"); file = await prepareShareFile(); status.textContent = ""; }
    } catch {
      status.textContent = t("shareError");
      return;
    }
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: t("shareTitle") });
        return;
      } catch (err) {
        if (err.name === "AbortError") return;   // the visitor closed the share menu
        // Anything else: fall back to downloading the picture.
      }
    }
    offerDownload(file, file.name);
    status.textContent = t("shareDownloaded");
  });
}

// ---------------------------------------------------------------------------
// Drawing the pictures
//   drawCard     – the tall picture for the share button (1080×1350)
//   drawWideWeek – the week's link preview picture (1200×630)
//   drawWideSite – the site's fixed link preview picture (1200×630)
//   The link preview pictures are drawn by preview.html, see that file.
// ---------------------------------------------------------------------------

// The site's fonts load from Google Fonts. Wait for them, or the canvas
// would quietly use a plain fallback font.
async function loadCardFonts() {
  try {
    await Promise.all([
      document.fonts.load("700 100px " + CARD.display), document.fonts.load("600 70px " + CARD.display),
      document.fonts.load("400 30px " + CARD.body), document.fonts.load("600 30px " + CARD.body),
    ]);
  } catch {}
}

async function makeShareFile(week) {
  await loadCardFonts();
  const canvas = document.createElement("canvas");
  canvas.width = CARD.width;
  canvas.height = CARD.height;
  drawCard(canvas.getContext("2d"), week);
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("no image")), "image/png"));
  return new File([blob], t("shareFileName") + "-" + week.to + ".png", { type: "image/png" });
}

// The tall picture for the share button.
function drawCard(ctx, week) {
  const { width, height, pad } = CARD;
  const right = width - pad;
  background(ctx, width, height);
  logo(ctx, pad, 185, 120);

  // Title, dates, and which players are included
  ctx.fillStyle = CARD.white;
  ctx.font = "600 78px " + CARD.display;
  ctx.fillText(t("shareTitle"), pad, 285);
  ctx.fillStyle = CARD.soft;
  ctx.font = "400 36px " + CARD.body;
  ctx.fillText(weekDates(week), pad, 342);

  line(ctx, pad, right, 390);

  // Three headline numbers
  const stats = [[week.goals, t("tileGoals")], [week.assists, t("tileAssists")], [week.played.length, t("tilePlayed")]];
  stats.forEach(([num, label], i) => {
    const x = pad + i * 320;
    ctx.fillStyle = CARD.white;
    ctx.font = "700 110px " + CARD.display;
    ctx.fillText(String(num), x, 500);
    ctx.fillStyle = CARD.soft;
    ctx.font = "400 30px " + CARD.body;
    ctx.fillText(fit(ctx, label, 300), x, 545);
  });

  // Goalscorers and assists: as many rows as fit, then "+ 3 more"
  const [g, a] = rowsThatFit(week.scorers.length, week.assisters.length, LIST_BOTTOM - LIST_TOP);
  let y = LIST_TOP;
  if (week.scorers.length) y = drawList(ctx, pad, right, y, t("shareGoals"), week.scorers, g, p => p.goalCount);
  if (week.assisters.length) {
    if (week.scorers.length) y += GAP_H;
    drawList(ctx, pad, right, y, t("shareAssists"), week.assisters, a, p => p.assistCount);
  }

  // The marketing bit: where to find the site
  line(ctx, pad, right, 1195);
  ctx.fillStyle = CARD.soft;
  ctx.font = "400 30px " + CARD.body;
  ctx.fillText(fit(ctx, t("shareFooter"), right - pad), pad, 1248);
  ctx.fillStyle = CARD.white;
  ctx.font = "600 38px " + CARD.body;
  ctx.fillText(fit(ctx, SITE_ADDRESS, right - pad), pad, 1300);
}

// The week's link preview: title and numbers on the left, scorers on the right.
// Link previews are often shown small, so the text is big.
function drawWideWeek(ctx, week) {
  const W = 1200, H = 630, pad = 64;
  background(ctx, W, H);
  logo(ctx, pad, 120, 96);
  ctx.fillStyle = CARD.white;
  ctx.font = "600 64px " + CARD.display;
  ctx.fillText(t("shareTitle"), pad, 205);
  ctx.fillStyle = CARD.soft;
  ctx.font = "400 30px " + CARD.body;
  ctx.fillText(weekDates(week), pad, 255);

  // Goals and assists, big
  [[week.goals, t("tileGoals")], [week.assists, t("tileAssists")]].forEach(([num, label], i) => {
    const x = pad + i * 210;
    ctx.fillStyle = CARD.white;
    ctx.font = "700 110px " + CARD.display;
    ctx.fillText(String(num), x, 440);
    ctx.fillStyle = CARD.soft;
    ctx.font = "400 30px " + CARD.body;
    ctx.fillText(label, x, 482);
  });
  ctx.fillStyle = CARD.white;
  ctx.font = "600 28px " + CARD.body;
  ctx.fillText(SITE_ADDRESS, pad, H - 50);

  // Right half: the goalscorers (or the assists in a week without goals)
  const left = 560, right = W - pad;
  ctx.fillStyle = CARD.line;
  ctx.fillRect(left - 40, pad, 2, H - 2 * pad);
  const [heading, list, countOf] = week.scorers.length
    ? [t("shareGoals"), week.scorers, p => p.goalCount]
    : [t("shareAssists"), week.assisters, p => p.assistCount];
  const [shown] = rowsThatFit(list.length, 0, H - 2 * pad - 30);
  const height = HEAD_H + shown * ROW_H + (shown < list.length ? MORE_H : 0);
  drawList(ctx, left, right, Math.max(pad, (H - height) / 2 - 10), heading, list, shown, countOf, true);
}

// The site's fixed link preview: name, what it is, and the address.
function drawWideSite(ctx) {
  const W = 1200, H = 630, pad = 80;
  background(ctx, W, H);
  logo(ctx, pad, 250, 170);
  ctx.fillStyle = CARD.white;
  ctx.font = "400 44px " + CARD.body;
  let y = 340;
  for (const row of wrap(ctx, t("tagline"), W - 2 * pad).slice(0, 3)) { ctx.fillText(row, pad, y); y += 60; }
  ctx.fillStyle = CARD.soft;
  ctx.font = "600 30px " + CARD.body;
  ctx.fillText(SITE_ADDRESS, pad, H - 70);
}

// --- Small drawing helpers ---

function background(ctx, w, h) {
  ctx.fillStyle = CARD.blue;
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = "alphabetic";
}

// "Finn FTW", like the site's own heading
function logo(ctx, x, y, size) {
  ctx.font = "700 " + size + "px " + CARD.display;
  ctx.fillStyle = CARD.white;
  ctx.fillText("Finn ", x, y);
  ctx.fillStyle = CARD.soft;
  ctx.fillText("FTW", x + ctx.measureText("Finn ").width, y);
}

// "Fri 13.11. – Thu 19.11. · Men" (no "· All" when everyone is included)
function weekDates(week) {
  const who = gender === "men" ? t("genderMen") : gender === "women" ? t("genderWomen") : "";
  return shortDate(week.from) + " – " + shortDate(week.to) + (who ? " · " + who : "");
}

function line(ctx, x1, x2, y) {
  ctx.fillStyle = CARD.line;
  ctx.fillRect(x1, y, x2 - x1, 2);
}

// How many scorer rows and assist rows fit in the given height.
// Goalscorers matter most, so assists give way first. Both lists keep at
// least one row.
function rowsThatFit(scorerCount, assistCount, space) {
  const heightOf = (g, a) =>
    (scorerCount ? HEAD_H + g * ROW_H + (g < scorerCount ? MORE_H : 0) : 0) +
    (assistCount ? (scorerCount ? GAP_H : 0) + HEAD_H + a * ROW_H + (a < assistCount ? MORE_H : 0) : 0);
  let g = scorerCount, a = assistCount;
  while (heightOf(g, a) > space) {
    if (a > 1) a--;
    else if (g > 1) g--;
    else break;
  }
  return [g, a];
}

// One list from x to right: a small heading, then "3  ★ Adrian Svanbäck  Club" rows.
// wholeClubs: show a club only if its full name fits (no "…").
function drawList(ctx, left, right, y, heading, players, shown, countOf, wholeClubs) {
  ctx.fillStyle = CARD.soft;
  ctx.font = "600 28px " + CARD.body;
  ctx.fillText(heading, left, y + 30);
  y += HEAD_H;

  for (const p of players.slice(0, shown)) {
    const base = y + 44;
    ctx.fillStyle = CARD.white;
    ctx.font = "700 58px " + CARD.display;
    ctx.fillText(String(countOf(p)), left, base);

    let x = left + 80;
    if (isFavourite(p.id)) {          // followed players get a gold star
      ctx.fillStyle = CARD.gold;
      ctx.font = "400 38px " + CARD.body;
      ctx.fillText("★", x, base - 2);
      x += 50;
    }
    ctx.fillStyle = CARD.white;
    ctx.font = "600 40px " + CARD.body;
    const name = fit(ctx, p.name, right - x);
    ctx.fillText(name, x, base);
    x += ctx.measureText(name).width + 18;

    ctx.fillStyle = CARD.soft;
    ctx.font = "400 30px " + CARD.body;
    const clubFits = ctx.measureText(p.club).width <= right - x;
    if (clubFits || (!wholeClubs && right - x > 80)) ctx.fillText(fit(ctx, p.club, right - x), x, base);
    y += ROW_H;
  }
  if (shown < players.length) {
    ctx.fillStyle = CARD.soft;
    ctx.font = "400 30px " + CARD.body;
    ctx.fillText(t("shareMore", players.length - shown), left + 80, y + 34);
    y += MORE_H;
  }
  return y;
}

// Shorten a text with "…" so it fits the given width.
function fit(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(s + "…").width > maxWidth) s = s.slice(0, -1);
  return s.trimEnd() + "…";
}

// Split a text into lines that fit the given width.
function wrap(ctx, text, maxWidth) {
  const rows = [];
  let row = "";
  for (const word of text.split(" ")) {
    const test = row ? row + " " + word : word;
    if (row && ctx.measureText(test).width > maxWidth) { rows.push(row); row = word; }
    else row = test;
  }
  if (row) rows.push(row);
  return rows;
}
