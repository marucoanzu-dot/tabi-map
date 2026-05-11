import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import { PREFECTURES } from '../../data/prefectures';

const today = () => new Date().toISOString().slice(0, 10);
const MAX_PHOTOS = 5;

export default function DiaryForm({ defaultPrefCode, initialData, onSave, onCancel, compact = false }) {
  const [form, setForm] = useState({
    prefCodes: defaultPrefCode ? [defaultPrefCode] : (initialData?.prefCodes || []),
    date: initialData?.date || today(),
    body: initialData?.body || '',
    rating: initialData?.rating || 0,
    wantToReturn: initialData?.wantToReturn || false,
    photos: initialData?.photos || [],
  });
  const fileRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const togglePref = (code) => {
    set('prefCodes', form.prefCodes.includes(code)
      ? form.prefCodes.filter(c => c !== code)
      : [...form.prefCodes, code]);
  };

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_PHOTOS - form.photos.length;
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({
          ...f,
          photos: [...f.photos, { id: crypto.randomUUID(), dataUrl: ev.target.result, name: file.name }],
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (id) => set('photos', form.photos.filter(p => p.id !== id));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-3">
      {/* 都道府県タグ（compactモード以外） */}
      {!defaultPrefCode && !compact && (
        <div>
          <label className="text-xs text-stone-500 block mb-1">都道府県</label>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {PREFECTURES.map(p => (
              <button key={p.code} type="button" onClick={() => togglePref(p.code)}
                className={`text-xs px-2 py-1 rounded-full transition-colors ${
                  form.prefCodes.includes(p.code) ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 日付 */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">訪問日</label>
        <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400" />
      </div>

      {/* 本文 */}
      <div>
        <label className="text-xs text-stone-500 block mb-1">メモ</label>
        <textarea value={form.body} onChange={e => set('body', e.target.value)}
          placeholder="思い出を書き留めておこう..."
          rows={compact ? 2 : 4}
          className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-stone-400" />
      </div>

      {/* 写真添付 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-stone-500">写真（最大{MAX_PHOTOS}枚）</label>
          {form.photos.length < MAX_PHOTOS && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-50">
              <Camera size={12} /> 追加
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
        </div>
        {form.photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {form.photos.map(photo => (
              <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                <img src={photo.dataUrl} alt={photo.name} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(photo.id)}
                  className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 評価・再訪 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-stone-500 mb-1">評価</div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => set('rating', form.rating === n ? 0 : n)}
                className={`text-lg leading-none transition-colors ${n <= form.rating ? 'text-amber-400' : 'text-stone-200'}`}>★</button>
            ))}
          </div>
        </div>
        <button type="button" onClick={() => set('wantToReturn', !form.wantToReturn)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${
            form.wantToReturn ? 'bg-rose-50 text-rose-500 border border-rose-200' : 'bg-stone-50 text-stone-400 border border-stone-200'
          }`}>
          <span>{form.wantToReturn ? '♥' : '♡'}</span>
          <span>また行きたい</span>
        </button>
      </div>

      {/* 送信 */}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50">
            キャンセル
          </button>
        )}
        <button type="submit"
          className="flex-1 py-2 rounded-lg bg-stone-700 text-white text-sm font-medium hover:bg-stone-800">
          保存
        </button>
      </div>
    </form>
  );
}
