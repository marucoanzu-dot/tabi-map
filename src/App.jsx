import { useState } from 'react';
import { useMapData } from './hooks/useMapData';
import BottomNav from './components/layout/BottomNav';
import MapView from './components/map/MapView';
import DiaryView from './components/diary/DiaryView';
import StatsView from './components/stats/StatsView';
import SettingsView from './components/settings/SettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const {
    prefectures,
    municipalities,
    municipalityTotals,
    diaries,
    defaultColor,
    visitedCount,
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
  } = useMapData();

  return (
    <div className="flex flex-col h-[100dvh] max-w-md mx-auto bg-white overflow-hidden shadow-xl">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'map' && (
          <MapView
            prefectures={prefectures}
            municipalities={municipalities}
            municipalityTotals={municipalityTotals}
            diaries={diaries}
            defaultColor={defaultColor}
            visitedCount={visitedCount}
            onVisit={visitPrefecture}
            onUnvisit={unvisitPrefecture}
            onColorChange={updatePrefColor}
            onAddDiary={addDiary}
            onVisitMunicipality={visitMunicipality}
            onUnvisitMunicipality={unvisitMunicipality}
            onCacheMunicipalityTotal={cacheMunicipalityTotal}
          />
        )}
        {activeTab === 'diary' && (
          <DiaryView diaries={diaries} prefectures={prefectures} onAdd={addDiary} onUpdate={updateDiary} onDelete={deleteDiary} />
        )}
        {activeTab === 'stats' && (
          <StatsView prefectures={prefectures} municipalities={municipalities}
            municipalityTotals={municipalityTotals} diaries={diaries} />
        )}
        {activeTab === 'settings' && (
          <SettingsView defaultColor={defaultColor} onSetDefaultColor={setDefaultColor}
            onExport={exportData} onImport={importData} />
        )}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
