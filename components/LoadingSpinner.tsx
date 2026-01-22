import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  progress: number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ progress }) => {
  const [status, setStatus] = useState('Germinating seed...');

  useEffect(() => {
    if (progress < 30) setStatus('Sifting through ancient roots...');
    else if (progress < 60) setStatus('Tracing phonetic branches...');
    else if (progress < 90) setStatus('Unfolding lineage...');
    else setStatus('Blooming...');
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 w-full max-w-md animate-in fade-in duration-500 bg-transparent">
      {/* Botanical Growth Line */}
      <div className="relative w-full h-px bg-current opacity-10 flex items-center justify-center">
        {/* Active Growing Filament */}
        <div 
          className="absolute h-[2px] bg-accent-green transition-all duration-300 ease-out shadow-[0_0_8px_rgba(74,93,69,0.4)]"
          style={{ width: `${progress}%`, left: '0' }}
        />
        
        {/* Sprouting Nodes */}
        {[20, 40, 60, 80].map((pos) => (
          <div 
            key={pos}
            className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              progress >= pos ? 'bg-accent-green scale-100 opacity-100' : 'bg-transparent scale-0 opacity-0'
            }`}
            style={{ left: `${pos}%` }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-accent-green/30" />
          </div>
        ))}

        {/* The "Bloom" Tip */}
        <div 
          className="absolute w-3 h-3 border border-accent-green rounded-full bg-bg-paper transition-all duration-300 shadow-sm"
          style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute inset-1 bg-accent-green rounded-full animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <div className="h-8 overflow-hidden">
          <p 
            key={status}
            className="font-serif italic text-2xl tracking-wide opacity-90 animate-slide-up"
          >
            {status}
          </p>
        </div>
        <p className="font-sans text-[10px] uppercase tracking-[0.2em] opacity-40 font-bold">
          {Math.round(progress)}% Established
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default LoadingSpinner;