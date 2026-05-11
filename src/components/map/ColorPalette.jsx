import { useRef } from 'react';
import { PALETTE } from '../../data/colors';

export default function ColorPalette({ selected, onSelect }) {
  const inputRef = useRef(null);
  // パレット外の色が選ばれている場合はカスタムカラーとみなす
  const isCustom = selected && !PALETTE.some(c => c.hex === selected);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {PALETTE.map(c => (
        <button
          key={c.id}
          title={c.name}
          onClick={() => onSelect(c.hex)}
          className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
          style={{
            backgroundColor: c.hex,
            boxShadow: selected === c.hex ? `0 0 0 3px white, 0 0 0 5px ${c.hex}` : 'none',
          }}
        />
      ))}

      {/* フルカラーピッカー */}
      <label
        title="カスタムカラー"
        className="w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 relative overflow-hidden"
        style={{
          background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
          boxShadow: isCustom ? `0 0 0 3px white, 0 0 0 5px ${selected}` : 'none',
        }}
      >
        <input
          ref={inputRef}
          type="color"
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          value={isCustom ? selected : '#8FAF7E'}
          onChange={e => onSelect(e.target.value)}
        />
      </label>
    </div>
  );
}
