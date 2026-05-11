import { useState, useEffect } from 'react';
import { geoContains } from 'd3-geo';
import { LocateFixed, Loader2 } from 'lucide-react';
import JapanMap from './JapanMap';
import MunicipalityMap from './MunicipalityMap';
import PrefecturePanel from './PrefecturePanel';
import BottomSheet from '../layout/BottomSheet';
import { getPrefByCode } from '../../data/prefectures';
import { loadJapanFeatures, getCachedFeatures } from '../../data/japanFeatures';

export default function MapView({
  prefectures, municipalities, municipalityTotals,
  diaries, defaultColor, visitedCount,
  onVisit, onUnvisit, onColorChange, onAddDiary,
  onVisitMunicipality, onUnvisitMunicipality, onCacheMunicipalityTotal,
}) {
  const [geoFeatures, setGeoFeatures] = useState(() => getCachedFeatures());
  const [selectedCode, setSelectedCode] = useState(null);
  const [drillDownCode, setDrillDownCode] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!geoFeatures) loadJapanFeatures().then(setGeoFeatures);
  }, []);

  const handleFAB = () => {
    if (!navigator.geolocation) { alert('お使いのブラウザは位置情報に対応していません'); return; }
    if (!geoFeatures) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const pt = [pos.coords.longitude, pos.coords.latitude];
        const found = geoFeatures.find(f => geoContains(f, pt));
        if (found) {
          setSelectedCode(String(found.properties.id).padStart(2, '0'));
        } else {
          alert('現在地の都道府県を特定できませんでした');
        }
        setLocating(false);
      },
      () => { alert('位置情報の取得に失敗しました'); setLocating(false); },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  if (drillDownCode) {
    return (
      <MunicipalityMap
        prefCode={drillDownCode}
        municipalities={municipalities}
        diaries={diaries}
        defaultColor={defaultColor}
        onVisitMunicipality={onVisitMunicipality}
        onUnvisitMunicipality={onUnvisitMunicipality}
        onTotalLoaded={onCacheMunicipalityTotal}
        onAddDiary={onAddDiary}
        onBack={() => setDrillDownCode(null)}
      />
    );
  }

  const pct = Math.round((visitedCount / 47) * 100);

  return (
    <div className="relative flex flex-col h-full bg-[#EDE9E3]">
      {/* 制覇バッジ */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-sm rounded-full px-5 py-2 shadow-md">
          <span className="text-sm font-bold text-stone-800">{visitedCount}</span>
          <span className="text-xs text-stone-400 ml-1">/ 47</span>
          <span className="text-xs text-stone-400 mx-2">·</span>
          <span className="text-xs font-semibold text-stone-500">{pct}%</span>
        </div>
      </div>

      {/* 地図（flex-1で残り全高さを使う） */}
      <div className="flex-1 pt-14 pb-1 px-1 overflow-hidden">
        <JapanMap
          geoFeatures={geoFeatures}
          prefectures={prefectures}
          municipalities={municipalities}
          municipalityTotals={municipalityTotals}
          diaries={diaries}
          onPrefectureClick={setSelectedCode}
        />
      </div>

      {/* FABボタン（今ここにいる） */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={handleFAB}
          disabled={locating}
          className="flex items-center gap-2 bg-white rounded-full px-4 py-3 shadow-lg text-stone-700 text-sm font-medium hover:bg-stone-50 active:scale-95 transition-all disabled:opacity-60"
        >
          {locating
            ? <Loader2 size={16} className="animate-spin text-stone-400" />
            : <LocateFixed size={16} className="text-stone-600" />
          }
          {!locating && '今ここにいる'}
        </button>
      </div>

      {/* 都道府県パネル */}
      <BottomSheet
        isOpen={!!selectedCode}
        onClose={() => setSelectedCode(null)}
        title={selectedCode ? getPrefByCode(selectedCode)?.name || '' : ''}
      >
        {selectedCode && (
          <PrefecturePanel
            code={selectedCode}
            visitInfo={prefectures[selectedCode]}
            defaultColor={defaultColor}
            diaries={diaries}
            municipalities={municipalities}
            municipalityTotals={municipalityTotals}
            onVisit={onVisit}
            onUnvisit={onUnvisit}
            onColorChange={onColorChange}
            onAddDiary={onAddDiary}
            onDrillDown={(code) => { setSelectedCode(null); setTimeout(() => setDrillDownCode(code), 200); }}
            onClose={() => setSelectedCode(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
