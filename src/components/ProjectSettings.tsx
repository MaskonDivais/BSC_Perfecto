import React from 'react';
import { 
  Folder, 
  Save, 
  Download,
  Info,
  ArrowLeft,
  Sparkles,
  BookOpen,
  Layers,
  Cpu,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface ProjectSettingsProps {
  autosaveEnabled: boolean;
  setAutosaveEnabled: (enabled: boolean) => void;
  autosaveInterval: number;
  setAutosaveInterval: (interval: number) => void;
  savesLocalDirectory: string;
  setSavesLocalDirectory: (dir: string) => void;
  isEditingDirectory: boolean;
  setIsEditingDirectory: (editing: boolean) => void;
  editedDirValue: string;
  setEditedDirValue: (val: string) => void;
  saveCustomDirectory: () => void;
  onExportProjectFile: () => void;
  onBack: () => void;
  theme?: 'classic' | 'cosmic';
}

export default function ProjectSettings({
  autosaveEnabled,
  setAutosaveEnabled,
  autosaveInterval,
  setAutosaveInterval,
  savesLocalDirectory,
  setSavesLocalDirectory,
  isEditingDirectory,
  setIsEditingDirectory,
  editedDirValue,
  setEditedDirValue,
  saveCustomDirectory,
  onExportProjectFile,
  onBack,
  theme = 'cosmic',
}: ProjectSettingsProps) {
  const [currentTab, setCurrentTab] = React.useState<'settings' | 'info'>('settings');

  if (currentTab === 'info') {
    return (
      <div className="w-full h-full flex flex-col bg-[#04060b] overflow-hidden">
        {/* Header with back button */}
        <header className="px-6 md:px-12 py-5 bg-[#070911]/80 border-b border-[#151b2f] flex items-center justify-between shrink-0 select-none backdrop-blur-md">
          <button
            id="btn-back-to-settings"
            onClick={() => setCurrentTab('settings')}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#111527] hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Назад в Настройки</span>
          </button>

          <h1 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase hidden sm:block">
            Информационная справка (Info)
          </h1>

          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#111527] hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95"
            title="Закрыть настройки"
          >
            ✕
          </button>
        </header>

        {/* Info detail view */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 select-text bg-[#030408] custom-scrollbar scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* LARGE TITLE CARD */}
            <div className="relative bg-[#080d19] border border-cyan-500/20 rounded-3xl p-8 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[200px] h-[200px] rounded-full bg-indigo-500/5 blur-[60px] pointer-events-none" />
              
              <div className="relative space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-full text-cyan-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>Система активна</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase font-sans">
                  СЦЕНАРНЫЙ ПРОВОДНИК <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 font-bold">
                    STORY CRAFTER ВЕРСИЯ 0.0.1
                  </span>
                </h1>

                <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-2xl leading-relaxed">
                  Профессиональная интерактивная рабочая станция для проектирования нелинейных сюжетов, 
                  диалоговых цепочек и сюжетных сцен в реальном времени. Наш графический движок обеспечивает 
                  полную точность выравнивания, интеллектуальные переходы типов блоков и динамическую окраску связей.
                </p>
              </div>
            </div>

            {/* ОБЩИЕ ПРАВИЛА (GENERAL RULES) */}
            <div className="bg-[#080d19] border border-[#1a233b] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-[#1c2744] pb-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide font-sans">Общие правила</h2>
                  <p className="text-xs text-slate-500 font-sans">Фундаментальные правила и управление средой холста</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3 bg-[#04060b] border border-[#141b2e] p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-slate-200 font-bold uppercase">Автосохранение (Autosave)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Система производит автоматическую запись состояния во внутреннюю память локального кэша с интервалом от 1 до 5 минут. Ваши изменения в сценарии, включая все блоки, связи, файлы и свойства диалогов, надёжно защищены от потери.
                  </p>
                </div>

                <div className="space-y-3 bg-[#04060b] border border-[#141b2e] p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono text-slate-200 font-bold uppercase">Рабочие папки и Импорт</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Сгенерированная структура проекта привязана к стандартным каталогам (<code className="text-cyan-400">dist-desktop</code>, <code className="text-cyan-450">saves/</code>). Вы можете экспортировать или импортировать полную резервную копию холста в переносимом формате JSON.
                  </p>
                </div>

                <div className="space-y-3 bg-[#04060b] border border-[#141b2e] p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-450" />
                    <span className="text-xs font-mono text-slate-200 font-bold uppercase">Интерактивный холст</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Масштабируйте область графа с помощью колёсика мыши (Zoom) и перемещайте рабочий стол (Pan) простым перетаскиванием мыши на свободных участках холста. Доступна мгновенная авто-расстановка блоков по иерархическому дереву.
                  </p>
                </div>

                <div className="space-y-3 bg-[#04060b] border border-[#141b2e] p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-mono text-slate-200 font-bold uppercase">Выравнивание по сетке</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Функция выравнивания по координатной сетке 20x20 пикселей гарантирует строгое позиционирование блоков. Сетки привязки (Snapping) обеспечивают аккуратный вид соединений и профессиональную разметку без визуальной асимметрии.
                  </p>
                </div>
              </div>
            </div>

            {/* ПРАВИЛА И ТИПЫ БЛОКОВ (STORY CELLS & ROLES) */}
            <div className="bg-[#080d19] border border-[#1a233b] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-[#1c2744] pb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-orange-950 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-orange-450" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide font-sans">Типы блоков и Роли</h2>
                  <p className="text-xs text-slate-500 font-sans">Логические объекты сценария и правила их распределения</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* START NODE */}
                <div className="flex gap-4 p-4 rounded-2xl bg-[#04060b] border border-emerald-500/20 hover:border-emerald-500/40 transition-all">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#10b981] shadow-lg shadow-emerald-500/40 mt-1 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-emerald-450 uppercase flex items-center gap-1.5">
                      Начало сценария (Start Node)
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Входная логическая ячейка проекта. Всегда имеет фиксированный зелёный контур. Её исходящая точка и идущие от неё соединительные линии строго зафиксированы в зелёном цвете, чтобы служить очевидным индикатором стартового маршрута сценария.
                    </p>
                  </div>
                </div>

                {/* END NODE */}
                <div className="flex gap-4 p-4 rounded-2xl bg-[#04060b] border border-red-500/20 hover:border-red-500/40 transition-all">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444] shadow-lg shadow-red-500/40 mt-1 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-red-500 uppercase flex items-center gap-1.5">
                      Финал сценария (End Node)
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Конечный целевой блок, завершающий диалоговое или сюжетное дерево. Окрашивается в насыщенный красный контур. У этого блока нет исходящих коннекторов сценария, он служит только приёмником (Target Sink).
                    </p>
                  </div>
                </div>

                {/* DESCRIPTION NODE */}
                <div className="flex gap-4 p-4 rounded-2xl bg-[#04060b] border border-blue-500/20 hover:border-blue-500/40 transition-all">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] shadow-lg shadow-blue-500/40 mt-1 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-blue-400 uppercase flex items-center gap-1.5">
                      Канал диалога (Description/Story Block)
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Основная рабочая ячейка для записи монологов, описаний сцен и реплик. Обладает глубоко-синей рамкой, синим входящим терминалом и синей исходной соединительной точкой по умолчанию.
                    </p>
                  </div>
                </div>

                {/* VARIATION NODE */}
                <div className="flex gap-4 p-4 rounded-2xl bg-[#04060b] border border-orange-500/20 hover:border-orange-500/40 transition-all">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#f97316] shadow-lg shadow-orange-500/40 mt-1 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-orange-400 uppercase flex items-center gap-1.5">
                      Сюжетная развилка (Variation/Choice Block)
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      Блок выбора, поддерживающий создание альтернативных пользовательских решений и интерактивных кнопок выбора. Контур полностью окрашен в оранжевый цвет, включая список созданных вариаций внутри редактора.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ДИНАМИКА ЦВЕТОВЫХ ТОЧЕК И АВТО-КОРРЕКЦИИ (SOCKETS & AUTO-TYPING) */}
            <div className="bg-[#080d19] border border-[#1a233b] rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-[#1c2744] pb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-900/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide font-sans">Динамическое поведение связей</h2>
                  <p className="text-xs text-slate-500 font-sans">Автоматическое раскрашивание точек и интеллектуальный подбор типов</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="bg-[#04060b] border border-[#141b2e] p-5 rounded-2xl space-y-3">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase">1. Интеллектуальное закрашивание точек истока</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Точки, из которых исходят линии связи (на основном выходе или на кнопках вариаций), подстраиваются под целевой блок для улучшения визуального чтения:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-350 list-none pl-1">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                      <span>Если связь идёт в <strong>Синий блок диалога</strong> &rarr; исходящая точка окрашивается в <strong className="text-blue-450">Синий</strong> цвет.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#f97316]" />
                      <span>Если связь идёт в <strong>Оранжевую развилку выбора</strong> &rarr; исходящая точка окрашивается в <strong className="text-orange-400">Оранжевый</strong> цвет.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                      <span>Если связь идёт в <strong>Красный финал</strong> &rarr; исходящая точка окрашивается в <strong className="text-red-400">Красный</strong> цвет.</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-400 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-455 shrink-0" />
                      <span>При отсутствии соединения исходящая точка принимает исходный цвет своего родителя (по умолчанию). Начальный блок всегда выпускает зелёную связь.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#04060b] border border-[#141b2e] p-5 rounded-2xl space-y-3">
                  <h3 className="text-xs font-mono font-bold text-slate-300 uppercase">2. Автоматическое переключение типов блоков (Dynamic Type Casting)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Когда вы протягиваете соединительную линию из оранжевой точки выбора во внутрь обычного блока, система анализирует это действие:
                  </p>
                  <ul className="space-y-2 text-xs text-slate-350 list-inside list-disc font-sans pl-1">
                    <li>Получатель связи автоматически превращается в тип <strong>Variation (Оранжевый)</strong>.</li>
                    <li>Все внутренние рамки блока перекрашиваются, сигнализируя о наличии сложной логики диалога.</li>
                    <li>Если связь из точки развития удаляется, блок автоматически возвращается в стандартный синий тип <strong>Description (Диалог)</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* BUTTON BACK TO INITIAL DESIGN */}
            <div className="pt-4 text-center">
              <button
                id="btn-back-to-settings-footer"
                onClick={() => setCurrentTab('settings')}
                className="px-6 py-3 bg-[#111527] hover:bg-[#1a1f38] border border-[#1a233b] text-slate-300 hover:text-white rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                Вернуться к Настройкам Проекта
              </button>
            </div>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#04060b] overflow-hidden">
      
      {/* 1. Header with Name & single '✕' close button only */}
      <header className="px-6 md:px-12 py-5 bg-[#070911]/80 border-b border-[#151b2f] flex items-center justify-between shrink-0 select-none backdrop-blur-md">
        <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight font-sans">
          Project Settings
        </h1>

        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#111527] hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95"
          title="Close and Return"
        >
          ✕
        </button>
      </header>

      {/* Main scrolling layout */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 select-text bg-[#030408] custom-scrollbar scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-8 pb-20">
          
          {/* Section 1: Autosave */}
          <div className="bg-[#080d19] border border-[#1a233b] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
                <Save className="w-4 h-4 text-cyan-400" />
                <span>Autosave Setting</span>
              </span>
              
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={autosaveEnabled}
                  onChange={(e) => setAutosaveEnabled(e.target.checked)}
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 peer-checked:after:bg-white peer-checked:after:border-white"></div>
                <span className="ml-2.5 text-xs font-mono font-bold uppercase text-slate-300">
                  {autosaveEnabled ? 'Active' : 'Muted'}
                </span>
              </label>
            </div>

            {autosaveEnabled && (
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center text-xs font-mono text-slate-450 font-bold">
                  <span>Save Interval</span>
                  <span className="text-cyan-400 font-bold">
                    {autosaveInterval} {autosaveInterval === 1 ? 'Minute' : 'Minutes'}
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={autosaveInterval}
                  onChange={(e) => setAutosaveInterval(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-[#05060b] rounded-lg appearance-none cursor-pointer accent-cyan-400 border border-slate-800"
                />

                <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold px-1 select-none">
                  <span>1 M</span>
                  <span>2 M</span>
                  <span>3 M</span>
                  <span>4 M</span>
                  <span>5 M</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Work Directory */}
          <div className="bg-[#080d19] border border-[#1a233b] rounded-2xl p-6 space-y-4">
            <span className="text-xs font-mono font-bold text-slate-350 uppercase tracking-wider block">
              Work Directory
            </span>

            {isEditingDirectory ? (
              <div className="flex gap-2.5">
                <input
                  type="text"
                  value={editedDirValue}
                  onChange={(e) => setEditedDirValue(e.target.value)}
                  className="flex-1 bg-[#04060b] border border-[#232c45] text-xs font-mono text-slate-300 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={saveCustomDirectory}
                  className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  OK
                </button>
                <button
                  onClick={() => setIsEditingDirectory(false)}
                  className="px-3 bg-[#111627] text-slate-400 hover:text-white rounded-xl text-xs font-mono uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="bg-[#04060a] border border-[#151b2e] rounded-xl p-3 flex items-center justify-between gap-4 font-mono text-xs text-slate-300">
                <span className="truncate">{savesLocalDirectory}</span>
                <button
                  onClick={() => {
                    setEditedDirValue(savesLocalDirectory);
                    setIsEditingDirectory(true);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-bold uppercase transition-colors shrink-0 cursor-pointer"
                >
                  Edit Path
                </button>
              </div>
            )}
          </div>

          {/* Section 3: File Tree structure */}
          <div className="bg-[#080d19] border border-[#1a233b] rounded-2xl p-6 space-y-4">
            <span className="text-xs font-mono font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-cyan-400" />
              <span>Project Folder Tree</span>
            </span>
            
            <div className="font-mono text-[11px] space-y-2 bg-[#04060a] border border-[#151b2e] p-4 rounded-xl text-slate-300 select-all">
              <div className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-cyan-400" />
                <span>{savesLocalDirectory || 'dist-desktop'}</span>
              </div>
              <div className="pl-4 flex items-center gap-1.5 text-slate-400">
                <span>└──</span>
                <Folder className="w-4 h-4 text-cyan-500" />
                <span>saves/</span>
              </div>
              <div className="pl-4 flex items-center gap-1.5 text-slate-400">
                <span>└──</span>
                <Folder className="w-4 h-4 text-cyan-500" />
                <span>projects/</span>
              </div>
            </div>
          </div>

          {/* Section 4: Manual Backup / State download */}
          <div className="bg-[#080d19] border border-[#1a233b] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <span className="text-xs font-sans font-bold text-slate-200 block">
                Manual Graph Backup
              </span>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Download the visual node scenario blueprint instantly.
              </p>
            </div>
            
            <button
              onClick={onExportProjectFile}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-cyan-950/25 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </button>
          </div>

          {/* Section 5: Info Section with full project rules */}
          <div className="bg-[#080d19] border border-[#1a233b] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <span className="text-xs font-sans font-bold text-slate-200 block flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Инструкция и Правила Редактора (Info)</span>
              </span>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Все правила типизации блоков, закрашивания исходящих терминалов связей и автосохранений на русском языке.
              </p>
            </div>
            
            <button
              id="btn-open-rules-info"
              onClick={() => setCurrentTab('info')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-blue-950/20 active:scale-95 transition-all"
            >
              Открыть Info
            </button>
          </div>

        </div>
      </main>

    </div>
  );
}
