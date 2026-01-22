import React, { useState, useEffect, useRef, useCallback } from 'react';
import NavPill from './components/NavPill';
import SearchInput from './components/SearchInput';
import TreeDiagram from './components/TreeDiagram';
import FlowchartDiagram from './components/FlowchartDiagram';
import ChronologicalLine from './components/ChronologicalLine';
import HierarchicalEdgeBundling from './components/HierarchicalEdgeBundling';
import ForceDirectedGraph from './components/ForceDirectedGraph';
import ListView from './components/ListView';
import NodeTooltip from './components/NodeTooltip';
import SunburstChart from './components/SunburstChart';
import TreemapDiagram from './components/TreemapDiagram';
import CirclePacking from './components/CirclePacking';
import RadialTree from './components/RadialTree';
import SankeyDiagram from './components/SankeyDiagram';
import FishboneDiagram from './components/FishboneDiagram';
import LoadingSpinner from './components/LoadingSpinner';
import AboutSection from './components/AboutSection';
import GardenSection from './components/GardenSection';
import LoginModal from './components/LoginModal';
import { fetchEtymology } from './services/geminiService';
import { EtymologyTree, MindmapNode } from './types';
import { exportSvgAs, exportHtmlAs } from './utils/exportUtils';

type VisualizationMode = 'tree' | 'flowchart' | 'fishbone' | 'chronological' | 'edgeBundling' | 'force' | 'list' | 'sunburst' | 'treemap' | 'packing' | 'radial' | 'sankey';
type Page = 'home' | 'about' | 'garden' | 'login';
type ExportFormat = 'png' | 'svg' | 'pdf' | 'jpeg';
type TooltipVariant = 'modern' | 'manuscript';

const VIZ_OPTIONS = [
  { id: 'tree', label: 'Botanical Tree' },
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'fishbone', label: 'Fishbone' },
  { id: 'radial', label: 'Radial' },
  { id: 'sunburst', label: 'Sunburst' },
  { id: 'edgeBundling', label: 'Bundling' },
  { id: 'force', label: 'Force' },
  { id: 'sankey', label: 'Flow' },
  { id: 'chronological', label: 'Timeline' },
  { id: 'treemap', label: 'Treemap' },
  { id: 'packing', label: 'Packing' },
  { id: 'list', label: 'Manuscript' }
];

const Confetti: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            backgroundColor: ['#4A5D45', '#C27B66', '#A68A78', '#D4A373'][Math.floor(Math.random() * 4)],
            top: '50%',
            left: '50%',
            animation: `confetti-pop-${i} 2.5s cubic-bezier(0.1, 1, 0.1, 1) forwards`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: Array.from({ length: 50 }).map((_, i) => {
        const angle = (i / 50) * 360 + (Math.random() * 20);
        const dist = 100 + Math.random() * 400;
        const x = Math.cos(angle * Math.PI / 180) * dist;
        const y = Math.sin(angle * Math.PI / 180) * dist - (Math.random() * 100);
        return `
          @keyframes confetti-pop-${i} {
            0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
            50% { opacity: 1; }
            100% { transform: translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(1) rotate(${Math.random() * 720}deg); opacity: 0; }
          }
        `;
      }).join('\n') }} />
    </div>
  );
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('home');
  const [etymologyData, setEtymologyData] = useState<EtymologyTree | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [currentSearchWord, setCurrentSearchWord] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [exportTrigger, setExportTrigger] = useState<{ format: ExportFormat | null; timestamp: number } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [tooltipVariant, setTooltipVariant] = useState<TooltipVariant>('modern');
  const [showConfetti, setShowConfetti] = useState(false);
  const exportContainerRef = useRef<HTMLDivElement>(null);
  const isExportingRef = useRef<boolean>(false);

  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('tree');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: any } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportContainerRef.current && !exportContainerRef.current.contains(event.target as Node)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBloom = async (word: string) => {
    if (!word || isLoading) return;
    
    setCurrentSearchWord(word);
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    setEtymologyData(null);
    setShowConfetti(false);

    let currentP = 0;
    const startTime = Date.now();
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      currentP = Math.min(95, 95 * (1 - Math.exp(-elapsed / 400)));
      setLoadingProgress(currentP);
    }, 30);

    try {
      const data = await fetchEtymology(word);
      clearInterval(progressInterval);
      
      if (!data) throw new Error("Could not find lineage.");
      
      setLoadingProgress(100);
      setEtymologyData(data);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError("Bloom failed. Try another word.");
    } finally {
      setIsLoading(false);
      setTooltip(null);
    }
  };

  const handleContentExport = useCallback(async (content: SVGSVGElement | HTMLElement | null, isSvg: boolean) => {
    if (!content || !exportTrigger || isExportingRef.current) return;
    
    const { format } = exportTrigger;
    if (!format) return;

    isExportingRef.current = true;
    setExportTrigger(null);

    const fileName = `etymos_${currentSearchWord || 'roots'}_${visualizationMode}`;
    
    try {
      if (isSvg) await exportSvgAs(content as SVGSVGElement, format, fileName);
      else await exportHtmlAs(content as HTMLElement, format, fileName);
    } catch (err) { 
      console.error("Export failed:", err);
    } finally {
      setTimeout(() => {
        isExportingRef.current = false;
      }, 500);
    }
  }, [currentSearchWord, visualizationMode, exportTrigger]);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-dark-bg text-bg-paper' : 'bg-bg-paper text-text-ink'}`}>
      {showConfetti && <Confetti />}

      {/* Gaussian Blurred Navigation */}
      <nav className={`fixed top-8 left-1/2 -translate-x-1/2 bg-dark-bg/70 backdrop-blur-xl border border-white/10 p-3 px-6 rounded-full flex items-center gap-6 text-white z-[100] shadow-2xl text-sm font-medium transition-all duration-500 max-w-[95%] sm:max-w-none ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 font-serif italic text-lg cursor-pointer" onClick={() => setActivePage('home')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          <span className="hidden sm:inline">Etymos</span>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setActivePage('about')} className="text-white/70 hover:text-white transition-colors">About</button>
          <button onClick={() => setActivePage('garden')} className="text-white/70 hover:text-white transition-colors">Garden</button>
          <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />
          <button 
            onClick={() => setTooltipVariant(v => v === 'modern' ? 'manuscript' : 'modern')} 
            className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full hover:bg-white/20 transition-all text-[10px] uppercase tracking-tighter"
          >
            <span className="opacity-50">Tooltip:</span> {tooltipVariant}
          </button>
        </div>
      </nav>

      {activePage === 'about' && <AboutSection onClose={() => setActivePage('home')} />}
      {activePage === 'garden' && <GardenSection onClose={() => setActivePage('home')} onSelect={handleBloom} />}
      {activePage === 'login' && <LoginModal onClose={() => setActivePage('home')} />}

      <div className={`relative max-w-screen-xl mx-auto px-5 pt-36 pb-16 flex flex-col items-center z-10 ${isFullScreen ? 'hidden' : ''}`}>
        <h1 className="font-serif text-5xl md:text-5xl sm:text-4xl font-normal text-center tracking-tight mb-6 px-4">
          Trace the <span className={`italic transition-colors duration-500 ${isDarkMode ? 'text-accent-terra' : 'text-accent-green'}`}>ancestry</span> of your thoughts.
        </h1>
        <SearchInput onBloom={handleBloom} isLoading={isLoading} />
        
        {error && (
          <div className="mt-4 p-4 bg-brick/10 border border-brick/20 rounded-xl text-brick text-sm font-medium">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-5xl px-2">
          {VIZ_OPTIONS.map(viz => (
            <button
              key={viz.id}
              onClick={() => setVisualizationMode(viz.id as VisualizationMode)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                visualizationMode === viz.id 
                  ? (isDarkMode ? 'bg-accent-terra text-white shadow-md scale-105' : 'bg-accent-green text-white shadow-md scale-105') 
                  : (isDarkMode ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-white border border-gray-200 text-text-light hover:bg-gray-50')
              }`}
            >
              {viz.label}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full max-w-xl px-4">
          {etymologyData && (
            <div className="flex w-full gap-4">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Find root..." 
                  value={searchTerm} 
                  onChange={e=>setSearchTerm(e.target.value)} 
                  className={`w-full p-3 pl-10 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-200 text-text-ink'}`} 
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <div className="relative" ref={exportContainerRef}>
                <button 
                  onClick={() => setShowExportOptions(!showExportOptions)} 
                  className="bg-accent-terra text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-transform active:scale-95"
                >
                  Export
                </button>
                {showExportOptions && (
                  <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-deep py-2 z-[200] overflow-hidden animate-slide-in-top ${isDarkMode ? 'bg-gray-800 text-white border border-white/10' : 'bg-white text-text-ink border border-gray-100'}`}>
                    {['png', 'jpeg', 'pdf', 'svg'].map(f => (
                      <button 
                        key={f} 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportTrigger({ format: f as ExportFormat, timestamp: Date.now() });
                          setShowExportOptions(false);
                        }} 
                        className={`block w-full text-left px-4 py-3 text-sm uppercase font-bold tracking-wider ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-xl transition-all duration-300 self-end sm:self-auto ${isDarkMode ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-black/5 text-gray-600 hover:bg-black/10'}`}
            title="Toggle Visual Mode"
          >
            {isDarkMode ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M17.66 6.34l1.42-1.42"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
        </div>
      </div>

      <div className={`visualization-container w-full mt-12 pb-16 transition-all duration-500 relative min-h-[600px] flex items-center justify-center
                      ${isFullScreen ? 'fixed inset-0 !mt-0 !pb-0 z-[1000]' : ''}
                      ${isDarkMode ? 'bg-dark-bg' : 'bg-bg-paper'}`}>
        {isLoading ? <LoadingSpinner progress={loadingProgress} /> : etymologyData ? (
          <>
            {visualizationMode === 'tree' && <TreeDiagram data={etymologyData} searchTerm={searchTerm} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} isDarkMode={isDarkMode} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'flowchart' && <FlowchartDiagram data={etymologyData} searchTerm={searchTerm} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} isDarkMode={isDarkMode} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'fishbone' && <FishboneDiagram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} isDarkMode={isDarkMode} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'radial' && <RadialTree data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} isDarkMode={isDarkMode} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'sunburst' && <SunburstChart data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'treemap' && <TreemapDiagram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'packing' && <CirclePacking data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'sankey' && <SankeyDiagram data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} onNodeHover={setTooltip} onNodeLeave={()=>setTooltip(null)} />}
            {visualizationMode === 'chronological' && <ChronologicalLine data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} />}
            {visualizationMode === 'edgeBundling' && <HierarchicalEdgeBundling data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} />}
            {visualizationMode === 'force' && <ForceDirectedGraph data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, true)} isFullScreen={isFullScreen} />}
            {visualizationMode === 'list' && <ListView data={etymologyData} exportTrigger={exportTrigger} onContentReadyForExport={c => handleContentExport(c, false)} isFullScreen={isFullScreen} />}
          </>
        ) : !isLoading && (
          <div className={`text-center font-serif text-xl italic opacity-50 transition-colors duration-500 p-8 ${isDarkMode ? 'text-white' : 'text-text-light'}`}>
            Plant a seed in the search bar to begin.
          </div>
        )}
      </div>

      {/* Full-Screen Controls Overlay */}
      {etymologyData && isFullScreen && (
        <div className="fixed top-0 left-0 right-0 z-[1200] pt-8 flex flex-col items-center pointer-events-none">
          {/* Viz Switcher in Full Screen - Moved to Top */}
          <div className={`flex items-center gap-2 p-2 rounded-2xl backdrop-blur-xl border border-white/10 pointer-events-auto overflow-x-auto max-w-[90vw] no-scrollbar shadow-2xl ${isDarkMode ? 'bg-black/40' : 'bg-white/40'}`}>
            {VIZ_OPTIONS.map(viz => (
              <button
                key={viz.id}
                onClick={() => setVisualizationMode(viz.id as VisualizationMode)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  visualizationMode === viz.id 
                    ? (isDarkMode ? 'bg-accent-terra text-white' : 'bg-accent-green text-white') 
                    : (isDarkMode ? 'text-white/60 hover:text-white' : 'text-text-ink/60 hover:text-text-ink')
                }`}
              >
                {viz.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {etymologyData && (
        <button 
          onClick={()=>setIsFullScreen(!isFullScreen)} 
          className="fixed right-6 bottom-6 p-4 rounded-full bg-dark-bg text-white shadow-xl z-[1300] active:scale-95 transition-transform"
          title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullScreen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/></svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          )}
        </button>
      )}

      {tooltip && (
        <NodeTooltip 
          x={tooltip.x} 
          y={tooltip.y} 
          word={tooltip.content.word} 
          language={tooltip.content.language} 
          meaning={tooltip.content.meaning} 
          era={tooltip.content.era}
          context={tooltip.content.context}
          isDarkMode={isDarkMode}
          variant={tooltipVariant}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-in-top {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-top {
          animation: slide-in-top 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default App;