import { useRef, useCallback, useEffect, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { DEFAULT_COLOR } from '../../data/colors';

function calcPrefFill(code, prefectures, municipalities, municipalityTotals) {
  const direct = prefectures[code];
  const prefMuniKeys = Object.keys(municipalities).filter(k => k.startsWith(code));

  if (!direct && prefMuniKeys.length === 0) return { color: '#E8E4DF', opacity: 1, shimmer: false };

  const color = direct?.color || municipalities[prefMuniKeys[0]]?.color || DEFAULT_COLOR;
  if (prefMuniKeys.length === 0) return { color, opacity: 1, shimmer: false };

  const total = municipalityTotals[code];
  if (!total) return { color, opacity: 0.7, shimmer: false };

  const ratio = prefMuniKeys.length / total;
  if (ratio >= 1)     return { color, opacity: 1,    shimmer: true };
  if (ratio >= 0.67)  return { color, opacity: 0.85, shimmer: false };
  if (ratio >= 0.34)  return { color, opacity: 0.60, shimmer: false };
  return                     { color, opacity: 0.35, shimmer: false };
}

export default function JapanMap({ geoFeatures, prefectures, municipalities, municipalityTotals, diaries, onPrefectureClick }) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 400, h: 520 });

  // ── ズーム/パン状態 ──────────────────────────────────────────
  const [xform, setXformState] = useState({ s: 1, x: 0, y: 0 });
  const xformRef = useRef({ s: 1, x: 0, y: 0 });   // イベントハンドラ内で最新値を読む用
  const gestureRef = useRef(null);

  function setXform(val) {
    xformRef.current = val;
    setXformState(val);
  }

  const resetZoom = useCallback(() => setXform({ s: 1, x: 0, y: 0 }), []);

  // ── サイズ監視 ────────────────────────────────────────────────
  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSize]);

  // ── タッチジェスチャー ─────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const dist = (t) => Math.hypot(t[1].clientX - t[0].clientX, t[1].clientY - t[0].clientY);
    const mid  = (t, r) => ({
      x: (t[0].clientX + t[1].clientX) / 2 - r.left,
      y: (t[0].clientY + t[1].clientY) / 2 - r.top,
    });

    function onTouchStart(e) {
      const cur = xformRef.current;
      const rect = el.getBoundingClientRect();
      if (e.touches.length === 2) {
        const t = [e.touches[0], e.touches[1]];
        gestureRef.current = {
          type: 'pinch', d0: dist(t), m0: mid(t, rect),
          s0: cur.s, x0: cur.x, y0: cur.y,
        };
      } else if (e.touches.length === 1) {
        gestureRef.current = {
          type: 'pan',
          px: e.touches[0].clientX - rect.left,
          py: e.touches[0].clientY - rect.top,
          s0: cur.s, x0: cur.x, y0: cur.y,
        };
      }
    }

    function onTouchMove(e) {
      const g = gestureRef.current;
      if (!g) return;
      e.preventDefault();   // スクロール防止（passive:false 必須）
      const rect = el.getBoundingClientRect();

      if (g.type === 'pinch' && e.touches.length >= 2) {
        const t = [e.touches[0], e.touches[1]];
        const newS = Math.max(1, Math.min(8, g.s0 * (dist(t) / g.d0)));
        // ピンチ中心点に向かってズーム
        const fixX = (g.m0.x - g.x0) / g.s0;
        const fixY = (g.m0.y - g.y0) / g.s0;
        setXform({ s: newS, x: g.m0.x - fixX * newS, y: g.m0.y - fixY * newS });
      } else if (g.type === 'pan' && e.touches.length === 1) {
        const cx = e.touches[0].clientX - rect.left;
        const cy = e.touches[0].clientY - rect.top;
        setXform({ s: g.s0, x: g.x0 + cx - g.px, y: g.y0 + cy - g.py });
      }
    }

    function onTouchEnd() { gestureRef.current = null; }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove',  onTouchMove,  { passive: false }); // preventDefault使うためpassive:false
    el.addEventListener('touchend',   onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove',  onTouchMove);
      el.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  // ── 描画 ──────────────────────────────────────────────────────
  const diaryPrefCodes = new Set(diaries.flatMap(d => d.prefCodes || []));

  let projection, pathGen;
  if (geoFeatures && size.w > 0 && size.h > 0) {
    const fc = { type: 'FeatureCollection', features: geoFeatures };
    const PAD = 10;
    projection = geoMercator().fitExtent(
      [[PAD, PAD], [size.w - PAD, size.h - PAD]],
      fc
    );
    pathGen = geoPath().projection(projection);
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{ touchAction: 'none' }}
    >
      {(!geoFeatures || !pathGen) ? (
        <div className="flex items-center justify-center h-full text-stone-400 text-sm">
          地図を読み込み中...
        </div>
      ) : (
        <>
          <svg
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            style={{
              transform: `translate(${xform.x}px, ${xform.y}px) scale(${xform.s})`,
              transformOrigin: '0 0',
              willChange: 'transform',
              display: 'block',
            }}
          >
            {geoFeatures.map(geo => {
              const code = String(geo.properties.id).padStart(2, '0');
              const { color, opacity, shimmer } = calcPrefFill(code, prefectures, municipalities, municipalityTotals);
              const d = pathGen(geo);
              if (!d) return null;
              return (
                <path
                  key={code}
                  d={d}
                  fill={color}
                  fillOpacity={opacity}
                  stroke="#D4CFC9"
                  strokeWidth={0.7}
                  className={`cursor-pointer hover:brightness-95 transition-all ${shimmer ? 'shimmer-path' : ''}`}
                  onClick={() => onPrefectureClick(code)}
                />
              );
            })}
            {/* 日記ドット */}
            {geoFeatures.map(geo => {
              const code = String(geo.properties.id).padStart(2, '0');
              if (!diaryPrefCodes.has(code)) return null;
              const c = pathGen.centroid(geo);
              if (!c || isNaN(c[0])) return null;
              return (
                <circle
                  key={`dot-${code}`}
                  cx={c[0]} cy={c[1]} r={2.5}
                  fill="white"
                  stroke="rgba(0,0,0,0.25)"
                  strokeWidth={0.8}
                  className="pointer-events-none"
                />
              );
            })}
          </svg>

          {/* ズームリセットボタン（拡大中のみ表示） */}
          {xform.s > 1.05 && (
            <button
              onClick={resetZoom}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-stone-600 shadow-sm border border-stone-100 active:scale-95 transition-all"
            >
              リセット
            </button>
          )}
        </>
      )}
    </div>
  );
}
