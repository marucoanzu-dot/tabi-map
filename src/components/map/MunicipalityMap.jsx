import { useEffect, useState, useRef, useCallback } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { ArrowLeft, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { getPrefByCode } from '../../data/prefectures';
import ColorPalette from './ColorPalette';
import BottomSheet from '../layout/BottomSheet';
import DiaryForm from '../diary/DiaryForm';

// 全国市区町村TopoJSONキャッシュ
let cachedTopo = null;
let loadingPromise = null;

function loadMunicipalityTopo() {
  if (cachedTopo) return Promise.resolve(cachedTopo);
  if (loadingPromise) return loadingPromise;
  loadingPromise = fetch('/municipalities.topojson')
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(topo => { cachedTopo = topo; return topo; });
  return loadingPromise;
}

function getMuniCode(props) { return String(props.N03_007 || '').trim(); }

function getMuniName(props) {
  const city = props.N03_003 || '';
  const ward = props.N03_004 || '';
  if (city && ward && city !== ward) return `${city}${ward}`;
  return ward || city || '不明';
}

export default function MunicipalityMap({
  prefCode, municipalities, diaries, defaultColor,
  onVisitMunicipality, onUnvisitMunicipality, onTotalLoaded, onAddDiary, onBack,
}) {
  const [geoFeatures, setGeoFeatures] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const containerRef                  = useRef(null);
  const [size, setSize]               = useState({ w: 400, h: 500 });
  const [selected, setSelected]       = useState(null); // { code, name }
  const [panelColor, setPanelColor]   = useState(defaultColor);
  const [diaryListOpen, setDiaryListOpen] = useState(false);
  const [diaryFormOpen, setDiaryFormOpen] = useState(false);

  const pref = getPrefByCode(prefCode);

  useEffect(() => {
    setLoading(true); setError(null);
    loadMunicipalityTopo()
      .then(topo => {
        const objKey = Object.keys(topo.objects)[0];
        const all = feature(topo, topo.objects[objKey]).features;
        const filtered = all.filter(f => getMuniCode(f.properties).startsWith(prefCode));
        setGeoFeatures(filtered);
        onTotalLoaded(prefCode, filtered.length);
      })
      .catch(() => setError('市区町村データの読み込みに失敗しました'))
      .finally(() => setLoading(false));
  }, [prefCode]);

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth;
      setSize({ w, h: Math.round(w * 1.15) });
    }
  }, []);

  useEffect(() => {
    updateSize();
    const ro = new ResizeObserver(updateSize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateSize]);

  const prefMuniKeys = Object.keys(municipalities).filter(k => k.startsWith(prefCode));
  const total = geoFeatures?.length || 0;
  const ratio = total > 0 ? prefMuniKeys.length / total : 0;
  const pct   = Math.round(ratio * 100);

  let pathGen = null;
  if (geoFeatures?.length && size.w > 0) {
    const fc = { type: 'FeatureCollection', features: geoFeatures };
    const proj = geoMercator().fitSize([size.w - 16, size.h - 16], fc);
    pathGen = geoPath().projection(proj);
  }

  const handleMuniClick = (code, name) => {
    if (!code) return;
    setSelected({ code, name });
    setPanelColor(municipalities[code]?.color || defaultColor);
    setDiaryListOpen(false);
    setDiaryFormOpen(false);
  };

  const handleToggleVisit = () => {
    if (!selected) return;
    if (municipalities[selected.code]) {
      onUnvisitMunicipality(selected.code);
    } else {
      onVisitMunicipality(selected.code, prefCode, panelColor);
    }
  };

  const handleColorChange = (hex) => {
    setPanelColor(hex);
    if (selected && municipalities[selected.code]) {
      onVisitMunicipality(selected.code, prefCode, hex);
    }
  };

  // 日記保存（訪問していなければ同時に訪問登録）
  const handleSaveDiary = (diaryData) => {
    if (selected && !municipalities[selected.code]) {
      onVisitMunicipality(selected.code, prefCode, panelColor);
    }
    onAddDiary({ ...diaryData, prefCodes: [prefCode], muniCodes: [selected.code] });
    setDiaryFormOpen(false);
    setDiaryListOpen(true); // 保存後は日記リストを開いておく
  };

  const diaryMuniCodes = new Set(diaries.flatMap(d => d.muniCodes || []));

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-stone-800">{pref?.name} — 市区町村</div>
          {total > 0 && (
            <div className="text-xs text-stone-400">{prefMuniKeys.length} / {total} 制覇（{pct}%）</div>
          )}
        </div>
        {total > 0 && (
          <div className="w-20 bg-stone-100 rounded-full h-1.5 shrink-0">
            <div className="h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: defaultColor }} />
          </div>
        )}
      </div>

      {/* 地図 */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
            読み込み中...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}
        {geoFeatures && pathGen && (
          <svg width={size.w} height={size.h} className="w-full">
            <g transform="translate(8, 8)">
              {geoFeatures.map((geo, i) => {
                const props = geo.properties;
                const code  = getMuniCode(props);
                const name  = getMuniName(props);
                const visit = municipalities[code];
                const hasDiary = diaryMuniCodes.has(code);
                const d = pathGen(geo);
                if (!d) return null;
                const centroid = pathGen.centroid(geo);
                return (
                  <g key={code || i} onClick={() => handleMuniClick(code, name)}>
                    <path
                      d={d}
                      fill={visit ? visit.color : '#E8E4DC'}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      className="cursor-pointer hover:opacity-75 transition-opacity"
                    />
                    {hasDiary && centroid && !isNaN(centroid[0]) && (
                      <circle cx={centroid[0]} cy={centroid[1]} r={2}
                        fill="white" stroke="rgba(0,0,0,0.25)" strokeWidth={0.8}
                        className="pointer-events-none" />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* 市区町村パネル */}
      <BottomSheet
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name || ''}
      >
        {selected && (() => {
          const muniDiaries = diaries.filter(d => (d.muniCodes || []).includes(selected.code));
          const isVisited   = !!municipalities[selected.code];

          return (
            <div className="space-y-0 -mx-1">

              {/* カラーパレット */}
              <div className="px-1 pb-4">
                <p className="text-[11px] text-stone-400 font-medium tracking-wide uppercase mb-2.5">塗りつぶし色</p>
                <ColorPalette selected={panelColor} onSelect={handleColorChange} />
              </div>

              {/* 訪問ボタン */}
              {!isVisited ? (
                <button
                  onClick={handleToggleVisit}
                  className="w-full py-3 rounded-2xl text-white text-sm font-semibold mb-3 hover:opacity-90 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: panelColor }}
                >
                  訪問済みにする
                </button>
              ) : (
                <button
                  onClick={handleToggleVisit}
                  className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 mb-1 transition-colors"
                >
                  訪問を取り消す
                </button>
              )}

              <div className="h-px bg-stone-100 mx-1" />

              {/* 日記セクション */}
              <div className="pt-3 space-y-1">

                {/* 日記件数 行（アコーディオン） */}
                <button
                  onClick={() => { setDiaryListOpen(!diaryListOpen); setDiaryFormOpen(false); }}
                  className="w-full flex items-center justify-between px-1 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  <span className="text-sm text-stone-700 font-medium">日記</span>
                  <div className="flex items-center gap-1.5">
                    {muniDiaries.length > 0 && (
                      <span className="text-sm text-stone-400">{muniDiaries.length}件</span>
                    )}
                    {diaryListOpen
                      ? <ChevronDown size={15} className="text-stone-400" />
                      : <ChevronRight size={15} className="text-stone-400" />
                    }
                  </div>
                </button>

                {/* 日記一覧 */}
                {diaryListOpen && (
                  <div className="space-y-1.5 pb-1">
                    {muniDiaries.length === 0 ? (
                      <p className="text-xs text-stone-400 px-1 py-2">まだ日記がありません</p>
                    ) : (
                      muniDiaries.slice(0, 5).map(d => (
                        <div key={d.id} className="bg-stone-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
                          {d.photos?.[0] && (
                            <img src={d.photos[0].dataUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-stone-700 truncate leading-snug">
                              {d.body?.split('\n')[0] || '（本文なし）'}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-stone-400">{d.date}</span>
                              {d.rating > 0 && <span className="text-[11px] text-amber-400">{'★'.repeat(d.rating)}</span>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {muniDiaries.length > 5 && (
                      <p className="text-xs text-stone-400 text-center py-1">他 {muniDiaries.length - 5} 件</p>
                    )}
                  </div>
                )}

                {/* 日記を追加 行（何件あっても常に表示） */}
                <button
                  onClick={() => { setDiaryFormOpen(!diaryFormOpen); setDiaryListOpen(false); }}
                  className="w-full flex items-center gap-2 px-1 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                >
                  <Plus size={14} className="text-stone-400" />
                  <span className="text-sm text-stone-600">日記を追加</span>
                </button>

                {/* 日記フォーム */}
                {diaryFormOpen && (
                  <div className="bg-stone-50 rounded-2xl p-3 mt-1">
                    <DiaryForm
                      compact
                      defaultPrefCode={prefCode}
                      onSave={handleSaveDiary}
                      onCancel={() => setDiaryFormOpen(false)}
                    />
                  </div>
                )}
              </div>

            </div>
          );
        })()}
      </BottomSheet>
    </div>
  );
}
