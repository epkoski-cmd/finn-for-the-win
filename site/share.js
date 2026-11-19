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
// `week` = { from, to, played, goals, assists, scorers, assisters }
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
// Drawing the picture
// ---------------------------------------------------------------------------
async function makeShareFile(week) {
  // The site's fonts load from Google Fonts. Wait for them, or the canvas
  // would quietly use a plain fallback font.
  try {
    await Promise.all([
      document.fonts.load("700 100px " + CARD.display), document.fonts.load("600 70px " + CARD.display),
      document.fonts.load("400 30px " + CARD.body), document.fonts.load("600 30px " + CARD.body),
    ]);
  } catch {}

  const canvas = document.createElement("canvas");
  canvas.width = CARD.width;
  canvas.height = CARD.height;
  const ctx = canvas.getContext("2d");
  drawCard(ctx, week);

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("no image")), "image/png"));
  return new File([blob], t("shareFileName") + "-" + week.to + ".png", { type: "image/png" });
}

function drawCard(ctx, week) {
  const { width, height, pad } = CARD;
  const right = width - pad;
  ctx.fillStyle = CARD.blue;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";

  // "Finn FTW", like the site's own heading
  ctx.font = "700 120px " + CARD.display;
  ctx.fillStyle = CARD.white;
  ctx.fillText("Finn ", pad, 185);
  ctx.fillStyle = CARD.soft;
  ctx.fillText("FTW", pad + ctx.measureText("Finn ").width, 185);

  // Title, dates, and which players are included
  ctx.fillStyle = CARD.white;
  ctx.font = "600 78px " + CARD.display;
  ctx.fillText(t("shareTitle"), pad, 285);
  ctx.fillStyle = CARD.soft;
  ctx.font = "400 36px " + CARD.body;
  const who = gender === "men" ? t("genderMen") : gender === "women" ? t("genderWomen") : "";
  ctx.fillText(shortDate(week.from) + " – " + shortDate(week.to) + (who ? " · " + who : ""), pad, 342);

  line(ctx, 390);

  // Three headline numbers
  const stats = [[week.goals, t("tileGoals")], [week.assists, t("tileAssists")], [week.played, t("tilePlayed")]];
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
  const [g, a] = rowsThatFit(week.scorers.length, week.assisters.length);
  let y = LIST_TOP;
  if (week.scorers.length) y = drawList(ctx, y, t("shareGoals"), week.scorers, g, p => p.goalCount);
  if (week.assisters.length) {
    if (week.scorers.length) y += GAP_H;
    drawList(ctx, y, t("shareAssists"), week.assisters, a, p => p.assistCount);
  }

  // The marketing bit: where to find the site
  line(ctx, 1195);
  ctx.fillStyle = CARD.soft;
  ctx.font = "400 30px " + CARD.body;
  ctx.fillText(fit(ctx, t("shareFooter"), right - pad), pad, 1248);
  ctx.fillStyle = CARD.white;
  ctx.font = "600 38px " + CARD.body;
  ctx.fillText(fit(ctx, SITE_ADDRESS, right - pad), pad, 1300);
}

function line(ctx, y) {
  ctx.fillStyle = CARD.line;
  ctx.fillRect(CARD.pad, y, CARD.width - 2 * CARD.pad, 2);
}

// How many scorer rows and assist rows fit between LIST_TOP and LIST_BOTTOM.
// Goalscorers matter most, so assists give way first. Both lists keep at
// least one row.
function rowsThatFit(scorerCount, assistCount) {
  const heightOf = (g, a) =>
    (scorerCount ? HEAD_H + g * ROW_H + (g < scorerCount ? MORE_H : 0) : 0) +
    (assistCount ? (scorerCount ? GAP_H : 0) + HEAD_H + a * ROW_H + (a < assistCount ? MORE_H : 0) : 0);
  let g = scorerCount, a = assistCount;
  while (heightOf(g, a) > LIST_BOTTOM - LIST_TOP) {
    if (a > 1) a--;
    else if (g > 1) g--;
    else break;
  }
  return [g, a];
}

// One list: a small heading, then "3  ★ Adrian Svanbäck  Club" rows.
function drawList(ctx, y, heading, players, shown, countOf) {
  const { pad } = CARD;
  const right = CARD.width - pad;
  ctx.fillStyle = CARD.soft;
  ctx.font = "600 28px " + CARD.body;
  ctx.fillText(heading, pad, y + 30);
  y += HEAD_H;

  for (const p of players.slice(0, shown)) {
    const base = y + 44;
    ctx.fillStyle = CARD.white;
    ctx.font = "700 58px " + CARD.display;
    ctx.fillText(String(countOf(p)), pad, base);

    let x = pad + 80;
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
    if (right - x > 80) ctx.fillText(fit(ctx, p.club, right - x), x, base);
    y += ROW_H;
  }
  if (shown < players.length) {
    ctx.fillStyle = CARD.soft;
    ctx.font = "400 30px " + CARD.body;
    ctx.fillText(t("shareMore", players.length - shown), pad + 80, y + 34);
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
