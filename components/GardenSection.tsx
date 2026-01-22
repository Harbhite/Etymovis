import React from 'react';

const GardenSection: React.FC<{ onClose: () => void, onSelect: (w: string) => void }> = ({ onClose, onSelect }) => {
  const seeds = ['Cosmos', 'Language', 'Machine', 'Spirit', 'Forest', 'Alchemy', 'Infinity', 'Light', 'Shadow', 'Truth'];

  return (
    <div className="fixed inset-0 z-[2000] bg-bg-paper overflow-y-auto p-12">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-dark-bg text-white rounded-full">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div className="max-w-5xl mx-auto pt-20">
        <h2 className="font-serif text-5xl mb-4">The Linguistic Garden</h2>
        <p className="text-text-light text-xl mb-12 italic">Select a seed to watch it grow.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {seeds.map(seed => (
            <button 
              key={seed} 
              onClick={() => { onSelect(seed); onClose(); }}
              className="group p-8 border border-accent-clay/20 rounded-2xl hover:border-accent-green hover:shadow-deep transition-all bg-white text-center"
            >
              <div className="w-12 h-12 bg-accent-clay/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-green">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-serif text-xl">{seed}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GardenSection;