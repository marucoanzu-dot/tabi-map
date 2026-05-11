import { useState, useMemo } from 'react';
import { Plus, SlidersHorizontal, X, Map } from 'lucide-react';
import DiaryCard from './DiaryCard';
import DiaryForm from './DiaryForm';
import BottomSheet from '../layout/BottomSheet';
import { PREFECTURES } from '../../data/prefectures';

const SORT_OPTIONS = [
  { value: 'date_desc', label: '新しい順' },
  { value: 'date_asc',  label: '古い順' },
  { value: 'rating',    label: '評価順' },
  { value: 'return',    label: 'また行きたい' },
];

export default function DiaryView({ diaries, prefectures, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [filterPref, setFilterPref] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const sorted = useMemo(() => {
    let list = [...diaries];
    if (filterPref) list = list.filter(d => (d.prefCodes || []).includes(filterPref));
    if (sortBy === 'return') list = list.filter(d => d.wantToReturn);
    return list.sort((a, b) => {
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return b.date.localeCompare(a.date);
    });
  }, [diaries, sortBy, filterPref]);

  const activeFilters = (filterPref ? 1 : 0) + (sortBy !== 'date_desc' ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-[#F7F5F2]">
      {/* ヘッダー */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1
          className="text-[20px] font-medium text-stone-800 tracking-tight"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
        >
          日記
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`relative p-2 rounded-xl transition-colors ${showFilter ? 'bg-stone-800 text-white' : 'bg-white text-stone-500 shadow-sm'}`}
          >
            <SlidersHorizontal size={16} />
            {activeFilters > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-400 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilters}
              </span>
            )}
          </button>
          {/* アウトラインボタン */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl transition-colors hover:bg-stone-50 active:scale-95"
            style={{ border: '1.5px solid #2C2C2C', color: '#2C2C2C', background: 'transparent' }}
          >
            <Plus size={14} />
            追加
          </button>
        </div>
      </div>

      {/* フィルターパネル */}
      {showFilter && (
        <div className="mx-4 mb-3 bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setSortBy(opt.value)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  sortBy === opt.value ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select value={filterPref} onChange={e => setFilterPref(e.target.value)}
              className="flex-1 text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-300">
              <option value="">すべての都道府県</option>
              {PREFECTURES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
            {(filterPref || sortBy !== 'date_desc') && (
              <button onClick={() => { setFilterPref(''); setSortBy('date_desc'); }}
                className="p-2 rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* リスト */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-56 gap-4">
            <Map size={40} className="text-stone-200" strokeWidth={1.2} />
            <span className="text-sm text-stone-300 font-light">
              {diaries.length > 0 ? 'フィルター条件に一致する日記がありません' : 'まだ日記がありません'}
            </span>
          </div>
        ) : (
          sorted.map(diary => (
            <DiaryCard
              key={diary.id}
              diary={diary}
              prefectures={prefectures}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <BottomSheet isOpen={showForm} onClose={() => setShowForm(false)} title="日記を追加">
        <DiaryForm onSave={(entry) => { onAdd(entry); setShowForm(false); }} onCancel={() => setShowForm(false)} />
      </BottomSheet>
    </div>
  );
}
