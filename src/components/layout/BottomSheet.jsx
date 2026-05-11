import { useEffect } from 'react';

export default function BottomSheet({ isOpen, onClose, title, children }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* シート本体 */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl z-50 max-h-[88vh] flex flex-col">
        {/* ハンドル */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 bg-stone-200 rounded-full" />
        </div>
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h2 className="text-base font-bold text-stone-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 text-sm leading-none"
          >
            ×
          </button>
        </div>
        <div className="h-px bg-stone-100 shrink-0 mx-5" />
        {/* コンテンツ */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
