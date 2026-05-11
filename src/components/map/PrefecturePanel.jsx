import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus } from 'lucide-react';
import ColorPalette from './ColorPalette';
import DiaryForm from '../diary/DiaryForm';
import { getPrefByCode, MUNICIPALITY_TOTALS } from '../../data/prefectures';

export default function PrefecturePanel({
  code, visitInfo, defaultColor, diaries,
  municipalities, municipalityTotals,
  onVisit, onUnvisit, onColorChange, onAddDiary, onDrillDown, onClose,
}) {
  const pref = getPrefByCode(code);
  const [selectedColor, setSelectedColor] = useState(visitInfo?.color || defaultColor);
  const [diaryListOpen, setDiaryListOpen] = useState(false);
  const [diaryFormOpen, setDiaryFormOpen] = useState(false);

  if (!pref) return null;

  const prefDiaries = diaries.filter(d => (d.prefCodes || []).includes(code));
  const prefMuniVisited = Object.keys(municipalities).filter(k => k.startsWith(code)).length;
  const muniTotal = MUNICIPALITY_TOTALS[code] || municipalityTotals[code] || 0;
  const muniPct = muniTotal ? Math.round((prefMuniVisited / muniTotal) * 100) : 0;

  const handleColorSelect = (hex) => {
    setSelectedColor(hex);
    if (visitInfo) onColorChange(code, hex);
  };

  const handleVisit = () => onVisit(code, selectedColor);

  const handleSaveDiary = (data) => {
    if (!visitInfo) onVisit(code, selectedColor);
    onAddDiary({ ...data, prefCodes: [code] });
    setDiaryFormOpen(false);
  };

  return (
    <div className="space-y-0 -mx-1">

      {/* ── カラーパレット ── */}
      <div className="px-1 pb-4">
        <p className="text-[11px] text-stone-400 font-medium tracking-wide uppercase mb-2.5">塗りつぶし色</p>
        <ColorPalette selected={selectedColor} onSelect={handleColorSelect} />
      </div>

      {/* 訪問ボタン（未訪問時） */}
      {!visitInfo && (
        <button
          onClick={handleVisit}
          className="w-full py-3 rounded-2xl text-white text-sm font-semibold mb-3 hover:opacity-90 active:scale-[0.98] transition-all"
          style={{ backgroundColor: selectedColor }}
        >
          訪問済みにする
        </button>
      )}
      {visitInfo && (
        <button
          onClick={() => onUnvisit(code)}
          className="w-full py-2 text-xs text-stone-400 hover:text-stone-600 mb-1 transition-colors"
        >
          訪問を取り消す
        </button>
      )}

      <div className="h-px bg-stone-100 mx-1" />

      {/* ── 日記セクション ── */}
      <div className="pt-3 space-y-1">
        {/* 日記件数 行 */}
        <button
          onClick={() => { setDiaryListOpen(!diaryListOpen); setDiaryFormOpen(false); }}
          className="w-full flex items-center justify-between px-1 py-2 rounded-xl hover:bg-stone-50 transition-colors"
        >
          <span className="text-sm text-stone-700 font-medium">日記</span>
          <div className="flex items-center gap-1.5">
            {prefDiaries.length > 0 && (
              <span className="text-sm text-stone-400">{prefDiaries.length}件</span>
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
            {prefDiaries.length === 0 ? (
              <p className="text-xs text-stone-400 px-1 py-2">まだ日記がありません</p>
            ) : (
              prefDiaries.slice(0, 5).map(d => (
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
            {prefDiaries.length > 5 && (
              <p className="text-xs text-stone-400 text-center py-1">他 {prefDiaries.length - 5} 件</p>
            )}
          </div>
        )}

        {/* 日記を追加 行 */}
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
              defaultPrefCode={code}
              compact
              onSave={handleSaveDiary}
              onCancel={() => setDiaryFormOpen(false)}
            />
          </div>
        )}
      </div>

      <div className="h-px bg-stone-100 mx-1 mt-3" />

      {/* ── 市区町村マップ ── */}
      <button
        onClick={() => onDrillDown(code)}
        className="w-full flex items-center justify-between px-1 py-3 mt-1 rounded-xl hover:bg-stone-50 transition-colors"
      >
        <span className="text-sm text-stone-700">市区町村マップを見る</span>
        <div className="flex items-center gap-2">
          {prefMuniVisited > 0 && (
            <span className="text-xs text-stone-400">{prefMuniVisited}/{muniTotal}</span>
          )}
          <ChevronRight size={15} className="text-stone-400" />
        </div>
      </button>

    </div>
  );
}
