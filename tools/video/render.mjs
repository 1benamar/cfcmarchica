// Renderiza escena.html fotograma a fotograma con Chromium (Playwright) y
// monta los vídeos del hero con ffmpeg.
//
//   node render.mjs                 → todo (horizontal + vertical)
//   node render.mjs --still 0,4,8   → solo capturas de prueba en ./frames/still-*.jpg
//   node render.mjs --only wide     → solo la versión horizontal
//
// Requiere: npm install (three), Playwright con Chromium y ffmpeg.
import { createServer } from "node:http";
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require("/opt/node22/lib/node_modules/playwright")); }

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "assets", "video");
const FRAMES = join(HERE, "frames");
const FPS = 30, T = 12;

const args = process.argv.slice(2);
const stillArg = args.includes("--still") ? args[args.indexOf("--still") + 1] : null;
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json" };
const server = createServer(async (req, res) => {
  try {
    const p = join(HERE, decodeURIComponent(req.url.split("?")[0]));
    const body = await readFile(p);
    res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl"],
});

async function renderVariant(name, w, h, times) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log("[page]", m.text()); });
  page.on("pageerror", e => console.log("[pageerror]", e.message));
  await page.goto(`http://127.0.0.1:${port}/escena.html?w=${w}&h=${h}`);
  await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 120000 });
  const dir = join(FRAMES, name);
  await mkdir(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < times.length; i++) {
    const data = await page.evaluate(t => window.renderFrame(t), times[i]);
    const file = stillArg ? join(FRAMES, `still-${name}-${times[i]}.jpg`) : join(dir, `f${String(i).padStart(4, "0")}.jpg`);
    await writeFile(file, Buffer.from(data.split(",")[1], "base64"));
    if (i % 30 === 0) console.log(`${name}: ${i + 1}/${times.length} · ${((Date.now() - t0) / (i + 1) / 1000).toFixed(2)} s/fotograma`);
  }
  await page.close();
  return dir;
}

function ffmpeg(argsList) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...argsList], { stdio: "inherit" });
}

const variants = [
  { name: "wide", w: 1920, h: 1080 },
  { name: "tall", w: 1080, h: 1920 },
].filter(v => !only || v.name === only);

await mkdir(OUT, { recursive: true });

for (const v of variants) {
  if (stillArg) {
    await renderVariant(v.name, v.w, v.h, stillArg.split(",").map(Number));
    continue;
  }
  const times = Array.from({ length: FPS * T }, (_, i) => i / FPS);
  const dir = await renderVariant(v.name, v.w, v.h, times);
  const input = ["-framerate", String(FPS), "-i", join(dir, "f%04d.jpg")];
  const x264 = ["-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"];
  if (v.name === "wide") {
    ffmpeg([...input, ...x264, "-crf", "26", join(OUT, "hero-1080.mp4")]);
    ffmpeg([...input, "-vf", "scale=1280:720:flags=lanczos", ...x264, "-crf", "24", join(OUT, "hero-720.mp4")]);
    ffmpeg(["-i", join(dir, "f0000.jpg"), "-vf", "scale=1920:1080", "-c:v", "libwebp", "-quality", "78", join(OUT, "hero-poster.webp")]);
  } else {
    ffmpeg([...input, "-vf", "scale=720:1280:flags=lanczos", ...x264, "-crf", "24", join(OUT, "hero-movil.mp4")]);
    ffmpeg(["-i", join(dir, "f0000.jpg"), "-vf", "scale=720:1280", "-c:v", "libwebp", "-quality", "78", join(OUT, "hero-poster-movil.webp")]);
  }
  console.log(`${v.name}: listo`);
}

await browser.close();
server.close();
if (!stillArg && existsSync(FRAMES) && !args.includes("--keep")) await rm(FRAMES, { recursive: true, force: true });
