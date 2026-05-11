import { useState } from 'react';
import { getPrefByCode } from '../../data/prefectures';
import DiaryForm from './DiaryForm';

const DEFAULT_PREF_COLOR = '#C9B99A';

export default function DiaryCard({ diary, prefectures, onUpdate, onDelete }) {
  const [editing, setEditing]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // 左ボーダー色：最初の紐づき県の塗りつぶし色
  const borderColor =
    (diary.prefCodes?.[0] && prefectures?.[diary.prefCodes[0]]?.color)
    || DEFAULT_PREF_COLOR;

  const bodyPreview = diary.body?.split('\n')[0]?.trim() || '';
  const hasPhoto    = diary.photos?.length > 0;

  // 県タグ情報
  const prefTags = (diary.prefCodes || []).map(c => {
    const pref  = getPrefByCode(c);
    const color = prefectures?.[c]?.color || DEFAULT_PREF_COLOR;
    return pref ? { name: pref.name, color } : null;
  }).filter(Boolean);

  if (editing) {
    return (
      <div className="rounded-2xl border border-stone-100 overflow-hidden shadow-sm"
        style={{ backgroundColor: '#FAFAF8' }}>
        <div className="p-4">
          <DiaryForm
            initialData={diary}
            onSave={(data) => { onUpdate(diary.id, data); setEditing(false); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="rounded-2xl shadow-sm overflow-hidden cursor-pointer active:opacity-90 transition-all"
        style={{ backgroundColor: '#FAFAF8', borderLeft: `4px solid ${borderColor}` }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* メインコンテンツ */}
        <div className="flex items-start gap-3 p-4">
          {/* 写真1枚目 */}
          {hasPhoto && (
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <img src={diary.photos[0].dataUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* 本文1行目 */}
            {bodyPreview ? (
              <p className="text-[15px] font-medium text-stone-800 truncate leading-snug">
                {bodyPreview}
              </p>
            ) : null}

            {/* メタ情報 */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[12px] font-light text-stone-400">{diary.date}</span>

              {/* 県タグ（ピル型・県色） */}
              {prefTags.map(tag => (
                <span
                  key={tag.name}
                  className="text-[11px] px-2 py-0.5 rounded-full leading-none font-normal"
                  style={{ backgroundColor: tag.color + '28', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}

              {diary.photos?.length > 1 && (
                <span className="text-[11px] text-stone-400">+{diary.photos.length - 1}枚</span>
              )}
            </div>
          </div>

          {/* 右側バッジ */}
          <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
            {diary.rating > 0 && (
              <span className="text-xs text-amber-400">{'★'.repeat(diary.rating)}</span>
            )}
            {diary.wantToReturn && (
              <span className="text-rose-400 text-sm leading-none">♥</span>
            )}
          </div>
        </div>

        {/* 展開部分 */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-stone-100 pt-3">
            {diary.body && (
              <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">
                {diary.body}
              </p>
            )}
            {diary.photos?.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {diary.photos.map(photo => (
                  <button key={photo.id} type="button"
                    onClick={(e) => { e.stopPropagation(); setLightbox(photo.dataUrl); }}
                    className="w-20 h-20 rounded-xl overflow-hidden ring-1 ring-stone-100 hover:opacity-90 transition-opacity">
                    <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                className="text-xs text-stone-500 hover:text-stone-700 font-medium"
              >
                編集
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm('削除しますか？')) onDelete(diary.id); }}
                className="text-xs text-rose-400 hover:text-rose-600 font-medium"
              >
                削除
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ライトボックス */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
        </div>
      )}
    </>
  );
}
