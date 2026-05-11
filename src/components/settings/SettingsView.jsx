import { useRef } from 'react';
import { Download, Upload, Palette } from 'lucide-react';
import ColorPalette from '../map/ColorPalette';
import { TOTAL_MUNICIPALITIES } from '../../data/prefectures';

export default function SettingsView({ defaultColor, onSetDefaultColor, onExport, onImport }) {
  const fileRef = useRef(null);

  return (
    <div className="flex flex-col h-full bg-[#F7F5F2]">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-lg font-bold text-stone-800 tracking-tight">設定</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">

        {/* デフォルト色 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={14} className="text-stone-400" />
            <span className="text-xs font-semibold text-stone-500 tracking-wide uppercase">デフォルト塗りつぶし色</span>
          </div>
          <ColorPalette selected={defaultColor} onSelect={onSetDefaultColor} />
        </div>

        {/* データ管理 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <span className="text-xs font-semibold text-stone-500 tracking-wide uppercase">データ</span>
          </div>
          <button onClick={onExport}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-50">
            <Download size={16} className="text-stone-400 shrink-0" />
            エクスポート（JSON）
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-50">
            <Upload size={16} className="text-stone-400 shrink-0" />
            インポート（JSON）
          </button>
          <input ref={fileRef} type="file" accept=".json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ''; }} />
        </div>

        {/* アプリ情報 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <span className="text-xs font-semibold text-stone-500 tracking-wide uppercase">アプリ情報</span>
          </div>
          {[
            ['バージョン', '1.0.0-beta'],
            ['都道府県数', '47'],
            ['市区町村数', `${TOTAL_MUNICIPALITIES.toLocaleString()}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between items-center px-5 py-3 border-t border-stone-50">
              <span className="text-sm text-stone-500">{label}</span>
              <span className="text-sm text-stone-700 font-medium">{value}</span>
            </div>
          ))}
          <div className="px-5 py-3 border-t border-stone-50">
            <div className="text-xs text-stone-400 leading-relaxed">
              地図データ：国土交通省 国土数値情報「行政区域データ」を使用。
              出典：dataofjapan/land、smartnews-smri/japan-topography（各 MIT License）
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
