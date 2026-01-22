import React from 'react';

interface NodeTooltipProps {
  x: number;
  y: number;
  word: string;
  language: string;
  meaning?: string;
  era?: string;
  context?: string;
  isDarkMode?: boolean;
  variant?: 'modern' | 'manuscript';
}

const NodeTooltip: React.FC<NodeTooltipProps> = ({ x, y, word, language, meaning, era, context, isDarkMode, variant = 'modern' }) => {
  const isManuscript = variant === 'manuscript';

  const containerClasses = isManuscript
    ? `bg-[#f4ecd8] border-[#d4c19c] text-[#4a3a2a] font-serif shadow-[0_15px_45px_-10px_rgba(74,58,42,0.4)]`
    : isDarkMode 
      ? 'bg-gray-900/95 border-white/20 text-white backdrop-blur-xl' 
      : 'bg-white/95 border-gray-100 text-text-ink backdrop-blur-xl';

  return (
    <>
      {/* Mobile Backdrop for Bottom Sheet */}
      <div className="fixed inset-0 z-[1001] bg-black/20 backdrop-blur-[2px] sm:hidden pointer-events-none animate-fade-in" />
      
      <div
        className={`fixed z-[1002] pointer-events-none border transition-all duration-300
                    /* Mobile: Bottom Sheet Styles */
                    bottom-0 left-0 right-0 rounded-t-3xl p-8 max-w-none translate-y-0
                    /* Desktop: Floating Tooltip Styles */
                    sm:bottom-auto sm:left-auto sm:right-auto sm:rounded-2xl sm:p-6 sm:max-w-[340px]
                    ${containerClasses} 
                    animate-tooltip-entry`}
        style={{
          // Only apply x/y on larger screens where hovering makes sense
          left: window.innerWidth > 640 ? (x + 30) + 'px' : '0',
          top: window.innerWidth > 640 ? y + 'px' : 'auto',
          transform: window.innerWidth > 640 ? 'translateY(-50%)' : 'none',
        }}
      >
        {/* Mobile Swipe/Grab Indicator */}
        <div className="w-12 h-1.5 bg-current opacity-10 rounded-full mx-auto mb-6 sm:hidden" />

        {/* Decorative Manuscript Corner (Desktop only) */}
        {isManuscript && (
          <div className="absolute top-0 right-0 w-12 h-12 opacity-30 pointer-events-none hidden sm:block">
            <svg viewBox="0 0 100 100" className="fill-current text-[#a08a6d]">
              <path d="M100 0 L100 100 L0 0 Z" />
            </svg>
          </div>
        )}

        <div className="flex justify-between items-baseline mb-4 sm:mb-3 gap-6">
          <div className={`font-sans text-[12px] sm:text-[11px] uppercase tracking-[0.15em] font-black ${isManuscript ? 'text-[#a08a6d]' : (isDarkMode ? 'text-white/40' : 'text-text-light')}`}>
            {language}
          </div>
          {era && (
            <div className={`font-sans text-[11px] sm:text-[10px] font-black italic px-2 py-0.5 rounded border ${isManuscript ? 'text-[#8b5a2b] border-[#d4c19c]' : (isDarkMode ? 'text-accent-terra border-white/10' : 'text-accent-green border-black/5')}`}>
              {era}
            </div>
          )}
        </div>
        
        <div className={`text-4xl sm:text-3xl font-bold leading-none mb-1 ${isManuscript ? 'font-serif italic' : 'font-serif tracking-tight'}`}>
          {word}
        </div>
        
        {meaning && (
          <div className={`text-[15px] sm:text-[13px] mt-5 sm:mt-4 leading-relaxed border-l-2 pl-4 py-1 ${isManuscript ? 'border-[#d4c19c] italic text-[#6b543c]' : (isDarkMode ? 'border-accent-terra/40 text-white/80 italic' : 'border-accent-green/30 text-text-light italic')}`}>
            "{meaning}"
          </div>
        )}
        
        {context && (
          <div className={`mt-6 sm:mt-5 pt-4 border-t text-[13px] sm:text-[11.5px] leading-relaxed font-sans ${isManuscript ? 'border-[#d4c19c]/50 text-[#8b7355]' : (isDarkMode ? 'border-white/10 text-white/50' : 'border-gray-100 text-text-light')}`}>
            {context}
          </div>
        )}
        
        {/* Dynamic Pointer (Desktop only) */}
        <div 
          className={`absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-5 rotate-45 border-l border-b transition-colors duration-300 hidden sm:block
                      ${isManuscript ? 'bg-[#f4ecd8] border-[#d4c19c]' : (isDarkMode ? 'bg-gray-900 border-white/20' : 'bg-white border-gray-100')}`}
        />

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes tooltip-entry {
            0% { opacity: 0; transform: ${window.innerWidth > 640 ? 'translateY(-40%) scale(0.9)' : 'translateY(100%)'}; filter: blur(8px); }
            100% { opacity: 1; transform: ${window.innerWidth > 640 ? 'translateY(-50%) scale(1)' : 'translateY(0)'}; filter: blur(0); }
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-tooltip-entry {
            animation: tooltip-entry 0.4s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
        `}} />
      </div>
    </>
  );
};

export default NodeTooltip;