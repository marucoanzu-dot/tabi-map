import { useMemo, useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';
import { geoMercator, geoPath } from 'd3-geo';
import { PREFECTURES, REGIONS, TOTAL_MUNICIPALITIES } from '../../data/prefectures';
import { loadJapanFeatures } from '../../data/japanFeatures';

// Canvas 用 rounded rect ヘルパー
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x,     y,     x + r, y,          r);
    ctx.closePath();
  }
}

async function buildMapCanvas(prefectures) {
  const features = await loadJapanFeatures();
  const W = 600, H = 760, DPR = 2;

  const canvas = document.createElement('canvas');
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  // 背景
  ctx.fillStyle = '#EDE9E3';
  ctx.fillRect(0, 0, W, H);

  // プロジェクション
  const fc = { type: 'FeatureCollection', features };
  const projection = geoMercator().fitExtent([[20, 56], [W - 20, H - 36]], fc);
  const gen = geoPath().projection(projection).context(ctx);

  // 都道府県を描画
  for (const geo of features) {
    const code = String(geo.properties.id).padStart(2, '0');
    const color = prefectures[code]?.color || '#E8E4DF';
    ctx.beginPath();
    gen(geo);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#D4CFC9';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  // 制覇バッジ（上部中央）
  const visited = Object.keys(prefectures).length;
  const pct     = Math.round(visited / 47 * 100);
  const label   = `${visited} / 47   ${pct}%`;
  const bw = 120, bh = 28, bx = W / 2 - bw / 2, by = 14;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(ctx, bx, by, bw, bh, 14);
  ctx.fill();
  ctx.fillStyle = '#3C3830';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 13px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText(label, W / 2, by + bh / 2);

  // アプリ名（下部中央）
  ctx.fillStyle = '#8A7F74';
  ctx.font = '400 13px "Hiragino Sans", "Yu Gothic", sans-serif';
  ctx.fillText('たびいろ', W / 2, H - 12);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

export default function StatsView({ prefectures, municipalities, diaries }) {
  const [exporting, setExporting] = useState(false);

  const visitedPrefCount = Object.keys(prefectures).length;
  const prefPct          = Math.round((visitedPrefCount / 47) * 100);
  const visitedMuniCount = Object.keys(municipalities || {}).length;
  const muniPct          = Math.round((visitedMuniCount / TOTAL_MUNICIPALITIES) * 100);

  const regionStats = useMemo(() => {
    return REGIONS.map(region => {
      const prefs   = PREFECTURES.filter(p => p.region === region);
      const visited = prefs.filter(p => prefectures[p.code]).length;
      return { region, total: prefs.length, visited };
    });
  }, [prefectures]);

  const recentVisits = useMemo(() => {
    return Object.entries(prefectures)
      .map(([code, info]) => ({ code, name: PREFECTURES.find(p => p.code === code)?.name, ...info }))
      .sort((a, b) => new Date(b.visitedAt) - new Date(a.visitedAt))
      .slice(0, 5);
  }, [prefectures]);

  const favDiaries = useMemo(() => {
    return [...diaries].filter(d => d.rating >= 4).sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [diaries]);

  const handleShareMap = async () => {
    setExporting(true);
    try {
      const blob = await buildMapCanvas(prefectures);
      const file = new File([blob], 'tabiiro-map.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: 'たびいろ - 私の旅の記録', files: [file] });
      } else {
        // ブラウザ fallback：ダウンロード
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = 'tabiiro-map.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F5F2]">
      {/* ヘッダー */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-stone-800 tracking-tight">統計</h1>
        <button
          onClick={handleShareMap}
          disabled={exporting}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-stone-600 shadow-sm hover:bg-stone-50 active:scale-95 transition-all disabled:opacity-50"
        >
          {exporting
            ? <Loader2 size={14} className="animate-spin" />
            : <Share2 size={14} />
          }
          {exporting ? '生成中...' : '地図をシェア'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

        {/* 都道府県 カード */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-xs text-stone-400 font-medium tracking-wide uppercase mb-1">都道府県</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-stone-800">{visitedPrefCount}</span>
                <span className="text-stone-400 text-sm">/ 47</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-300">{prefPct}%</div>
          </div>
          <div className="bg-stone-100 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${prefPct}%`, background: 'linear-gradient(90deg, #8FAF7E, #7DADA0)' }} />
          </div>
        </div>

        {/* 市区町村 カード */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-xs text-stone-400 font-medium tracking-wide uppercase mb-1">市区町村</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold text-stone-800">{visitedMuniCount}</span>
                <span className="text-stone-400 text-sm">/ {TOTAL_MUNICIPALITIES}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-stone-300">{muniPct}%</div>
          </div>
          <div className="bg-stone-100 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-700"
              style={{ width: `${muniPct}%`, background: 'linear-gradient(90deg, #7DADA0, #7B96A9)' }} />
          </div>
        </div>

        {/* 地域別 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-stone-400 font-medium tracking-wide uppercase mb-4">地域別達成率</div>
          <div className="space-y-3">
            {regionStats.map(({ region, total, visited }) => {
              const pct = Math.round((visited / total) * 100);
              return (
                <div key={region}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-stone-700">{region}</span>
                    <span className="text-xs text-stone-400">{visited}/{total}</span>
                  </div>
                  <div className="bg-stone-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: pct === 100 ? '#8FAF7E' : '#B0C4B0' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 最近訪れた場所 */}
        {recentVisits.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-stone-400 font-medium tracking-wide uppercase mb-3">最近訪れた場所</div>
            <div className="space-y-2.5">
              {recentVisits.map(v => (
                <div key={v.code} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white ring-offset-1"
                    style={{ backgroundColor: v.color }} />
                  <span className="text-sm text-stone-700 flex-1">{v.name}</span>
                  <span className="text-xs text-stone-400">
                    {v.visitedAt ? new Date(v.visitedAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 高評価日記 */}
        {favDiaries.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-stone-400 font-medium tracking-wide uppercase mb-3">お気に入り</div>
            <div className="space-y-2.5">
              {favDiaries.map(d => (
                <div key={d.id} className="flex items-start gap-3">
                  {d.photos?.[0] && (
                    <img src={d.photos[0].dataUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-stone-700 truncate font-medium">
                      {d.body?.split('\n')[0] || ''}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-amber-400">{'★'.repeat(d.rating)}</span>
                      <span className="text-xs text-stone-400">{d.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visitedPrefCount === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-stone-300 gap-3">
            <span className="text-5xl">🗾</span>
            <span className="text-sm">都道府県を塗って記録を始めよう</span>
          </div>
        )}
      </div>
    </div>
  );
}
