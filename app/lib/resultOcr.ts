// Apex「マッチリザルト」画面（16:9 フルスクリーン）から順位・チーム番号・キル数を読み取るための定義。
// 座標は 1280x720 を基準にしており、実画像のサイズに合わせて拡大縮小して使う。

export const OCR_REF_WIDTH = 1280;
export const OCR_REF_HEIGHT = 720;

export type OcrRect = { x: number; y: number; w: number; h: number };

export type OcrRowLayout = {
  placement: number;
  teamNumber: OcrRect;
  kills: OcrRect;
};

const ROW_HALF_HEIGHT = 15;

function rowLayout(placement: number, column: 'left' | 'right', cy: number): OcrRowLayout {
  const y = cy - ROW_HALF_HEIGHT;
  const h = ROW_HALF_HEIGHT * 2;
  // 「チーム」の文字の直後から数字部分だけを切り出す
  const teamX = column === 'left' ? 338 : 854;
  const killX = column === 'left' ? 688 : 1206;
  return {
    placement,
    teamNumber: { x: teamX, y, w: 80, h },
    kills: { x: killX, y, w: 38, h },
  };
}

// 左列: #1〜#9（#1・#2は行が太い）、右列: #10〜#20
export const OCR_ROW_LAYOUTS: OcrRowLayout[] = [
  rowLayout(1, 'left', 196),
  rowLayout(2, 'left', 271),
  ...Array.from({ length: 7 }, (_, i) => rowLayout(i + 3, 'left', 334 + i * 50)),
  ...Array.from({ length: 11 }, (_, i) => rowLayout(i + 10, 'right', 134 + i * 50)),
];

export function scaleRect(rect: OcrRect, width: number, height: number): OcrRect {
  const sx = width / OCR_REF_WIDTH;
  const sy = height / OCR_REF_HEIGHT;
  return { x: rect.x * sx, y: rect.y * sy, w: rect.w * sx, h: rect.h * sy };
}

// RGBA画素を「白背景に黒文字」へ二値化する（大津の方法）。
// 背景色が行ごとに異なるため、画素数の少ない側を文字とみなして極性を揃える。
export function binarizeForOcr(data: Uint8ClampedArray, width: number, height: number): void {
  const n = width * height;
  const lum = new Uint8Array(n);
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < n; i++) {
    const v = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
    lum[i] = v;
    hist[v]++;
  }

  let sumAll = 0;
  for (let v = 0; v < 256; v++) sumAll += v * hist[v];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = n - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }

  let bright = 0;
  for (let i = 0; i < n; i++) if (lum[i] > threshold) bright++;
  const textIsBright = bright < n / 2;

  for (let i = 0; i < n; i++) {
    const isText = textIsBright ? lum[i] > threshold : lum[i] <= threshold;
    const v = isText ? 0 : 255;
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
}

// 1文字分の特徴量（外接矩形を GLYPH_W x GLYPH_H に縮小した黒画素率と縦横比）
export const GLYPH_W = 8;
export const GLYPH_H = 12;
export type GlyphFeature = { aspect: number; grid: number[] };

// 実際のリザルト画面から作成した数字テンプレート（grid は黒画素率を0〜9で表したもの）
const DIGIT_TEMPLATES: Record<string, { aspect: number; grid: string }> = {
  0: { aspect: 0.701, grid: '378998737988899689422498992002989920029899200298992002989920029889200298895335986999999637888862' },
  1: { aspect: 0.365, grid: '789998867899999813359998000299980002999800029998000299980002999800018998000299980002999800017886' },
  2: { aspect: 0.67, grid: '378999736998799679622597783004970000169700015985001499510038961015985100589732328999779779998887' },
  3: { aspect: 0.655, grid: '698899855988999613228983000497200028972001599974003568981100159856200499898547987999999736889862' },
  4: { aspect: 0.736, grid: '000279500005996000279971005999720178698215964893597139937996799579999998353469960000289300001771' },
  5: { aspect: 0.661, grid: '599999955998888459732220596200006998764159999995134437982200049888200399896336987999999636899873' },
  6: { aspect: 0.631, grid: '379999737998899799622588993001549963331099999973997447999930038999300179896236996998999826898763' },
  7: { aspect: 0.6, grid: '676777767889899833344797000038950001598200028961000598300017960000499400017971000499500003872000' },
  8: { aspect: 0.684, grid: '049987523898798359722695693004955963369559999995598778968930149889200378796336986999999537679952' },
  9: { aspect: 0.655, grid: '268998635998899669733698793003988950039979865798389999980235469836300398697215985998789727999973' },
};

const ASPECT_WEIGHT = 20;

function classifyGlyph(g: GlyphFeature): string {
  let best = '';
  let bestDist = Infinity;
  for (const [digit, t] of Object.entries(DIGIT_TEMPLATES)) {
    let dist = ASPECT_WEIGHT * (g.aspect - t.aspect) ** 2;
    for (let i = 0; i < g.grid.length; i++) {
      dist += (g.grid[i] - Number(t.grid[i]) / 9) ** 2;
    }
    if (dist < bestDist) {
      bestDist = dist;
      best = digit;
    }
  }
  return best;
}

// 二値化済み画像の数字を読み取る。読めなければ null
export function recognizeNumber(data: Uint8ClampedArray, width: number, height: number): number | null {
  const glyphs = extractGlyphs(data, width, height);
  if (glyphs.length === 0 || glyphs.length > 3) return null;
  return Number(glyphs.map(classifyGlyph).join(''));
}

// 二値化済み画像から、列方向の切れ目で数字を1文字ずつ切り出す
export function extractGlyphs(data: Uint8ClampedArray, width: number, height: number): GlyphFeature[] {
  const isInk = (x: number, y: number) => data[(y * width + x) * 4] === 0;

  const colInk = new Array<number>(width).fill(0);
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) if (isInk(x, y)) colInk[x]++;
  }

  function bounds(x0: number, x1: number) {
    let y0 = height;
    let y1 = -1;
    for (let x = x0; x <= x1; x++) {
      for (let y = 0; y < height; y++) {
        if (isInk(x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      }
    }
    return { x0, x1, y0, y1 };
  }

  const runs: { x0: number; x1: number; y0: number; y1: number }[] = [];
  // 圧縮ノイズで隣の数字とつながった横長の塊は、インクが最も少ない列で分割する
  function pushRun(x0: number, x1: number) {
    const r = bounds(x0, x1);
    const w = x1 - x0 + 1;
    const h = r.y1 - r.y0 + 1;
    if (w > h * 1.05 && w >= 6) {
      let splitX = -1;
      let minInk = Infinity;
      for (let x = x0 + Math.floor(w * 0.3); x <= x1 - Math.floor(w * 0.3); x++) {
        if (colInk[x] < minInk) { minInk = colInk[x]; splitX = x; }
      }
      if (splitX > x0 && splitX < x1) {
        pushRun(x0, splitX - 1);
        pushRun(splitX + 1, x1);
        return;
      }
    }
    runs.push(r);
  }

  let start = -1;
  for (let x = 0; x <= width; x++) {
    const has = x < width && colInk[x] > 0;
    if (has && start < 0) start = x;
    if (!has && start >= 0) {
      pushRun(start, x - 1);
      start = -1;
    }
  }

  // 背景のゴミ（小さな点など）は数字の高さに満たないので除外
  const maxH = Math.max(0, ...runs.map((r) => r.y1 - r.y0 + 1));
  const glyphs = runs.filter((r) => r.y1 - r.y0 + 1 >= maxH * 0.7 && maxH >= height * 0.25);

  return glyphs.map((r) => {
    const gw = r.x1 - r.x0 + 1;
    const gh = r.y1 - r.y0 + 1;
    const grid: number[] = [];
    for (let gy = 0; gy < GLYPH_H; gy++) {
      for (let gx = 0; gx < GLYPH_W; gx++) {
        const sx0 = r.x0 + (gx * gw) / GLYPH_W;
        const sx1 = r.x0 + ((gx + 1) * gw) / GLYPH_W;
        const sy0 = r.y0 + (gy * gh) / GLYPH_H;
        const sy1 = r.y0 + ((gy + 1) * gh) / GLYPH_H;
        let ink = 0;
        let total = 0;
        for (let y = Math.floor(sy0); y < Math.max(Math.ceil(sy1), Math.floor(sy0) + 1); y++) {
          for (let x = Math.floor(sx0); x < Math.max(Math.ceil(sx1), Math.floor(sx0) + 1); x++) {
            total++;
            if (isInk(x, y)) ink++;
          }
        }
        grid.push(total > 0 ? ink / total : 0);
      }
    }
    return { aspect: gw / gh, grid };
  });
}
