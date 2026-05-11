import { useState, useCallback } from 'react';
import { DEFAULT_COLOR } from '../data/colors';

const STORAGE_KEY = 'tabi-map-data';

const defaultState = {
  prefectures: {},
  municipalities: {},       // { '13101': { color, prefCode, visitedAt } }
  municipalityTotals: {},   // { '13': 23 } — キャッシュ
  diaries: [],
  defaultColor: DEFAULT_COLOR,
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useMapData() {
  const [state, setState] = useState(load);

  const update = useCallback((updater) => {
    setState(prev => {
      const next = updater(prev);
      save(next);
      return next;
    });
  }, []);

  // ── 都道府県 ──
  const visitPrefecture = useCallback((code, color, visitedAt) => {
    update(prev => ({
      ...prev,
      prefectures: {
        ...prev.prefectures,
        [code]: { color, visitedAt: visitedAt || new Date().toISOString() },
      },
    }));
  }, [update]);

  const unvisitPrefecture = useCallback((code) => {
    update(prev => {
      const { [code]: _, ...rest } = prev.prefectures;
      return { ...prev, prefectures: rest };
    });
  }, [update]);

  const updatePrefColor = useCallback((code, color) => {
    update(prev => ({
      ...prev,
      prefectures: {
        ...prev.prefectures,
        [code]: { ...prev.prefectures[code], color },
      },
    }));
  }, [update]);

  // ── 市区町村 ──
  const visitMunicipality = useCallback((muniCode, prefCode, color, visitedAt) => {
    update(prev => ({
      ...prev,
      municipalities: {
        ...prev.municipalities,
        [muniCode]: { color, prefCode, visitedAt: visitedAt || new Date().toISOString() },
      },
    }));
  }, [update]);

  const unvisitMunicipality = useCallback((muniCode) => {
    update(prev => {
      const { [muniCode]: _, ...rest } = prev.municipalities;
      return { ...prev, municipalities: rest };
    });
  }, [update]);

  const cacheMunicipalityTotal = useCallback((prefCode, total) => {
    update(prev => ({
      ...prev,
      municipalityTotals: { ...prev.municipalityTotals, [prefCode]: total },
    }));
  }, [update]);

  // ── 日記 ──
  const addDiary = useCallback((entry) => {
    const diary = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    update(prev => ({ ...prev, diaries: [diary, ...prev.diaries] }));
    return diary.id;
  }, [update]);

  const updateDiary = useCallback((id, changes) => {
    update(prev => ({
      ...prev,
      diaries: prev.diaries.map(d => d.id === id ? { ...d, ...changes } : d),
    }));
  }, [update]);

  const deleteDiary = useCallback((id) => {
    update(prev => ({ ...prev, diaries: prev.diaries.filter(d => d.id !== id) }));
  }, [update]);

  const setDefaultColor = useCallback((color) => {
    update(prev => ({ ...prev, defaultColor: color }));
  }, [update]);

  const exportData = useCallback(() => {
    const exportable = { ...state, diaries: state.diaries.map(d => ({ ...d, photos: d.photos?.map(p => ({ ...p, dataUrl: '[base64 omitted]' })) })) };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabi-map-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const merged = { ...defaultState, ...imported };
        setState(merged);
        save(merged);
      } catch {
        alert('ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    prefectures: state.prefectures,
    municipalities: state.municipalities,
    municipalityTotals: state.municipalityTotals,
    diaries: state.diaries,
    defaultColor: state.defaultColor,
    visitedCount: Object.keys(state.prefectures).length,
    visitPrefecture,
    unvisitPrefecture,
    updatePrefColor,
    visitMunicipality,
    unvisitMunicipality,
    cacheMunicipalityTotal,
    addDiary,
    updateDiary,
    deleteDiary,
    setDefaultColor,
    exportData,
    importData,
  };
}
