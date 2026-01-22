import React from 'react';

const AboutSection: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[2000] bg-bg-paper overflow-y-auto p-12">
      <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-dark-bg text-white rounded-full">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div className="max-w-3xl mx-auto pt-20">
        <h2 className="font-serif text-5xl mb-8">About Etymos</h2>
        <p className="text-xl text-text-light mb-6">
          Etymos is a botanical tribute to the evolution of human thought. We believe that words are living organisms—seeds that germinate in antiquity, branching out into a forest of meaning.
        </p>
        <div className="grid grid-cols-2 gap-12 mt-12">
          <div>
            <h3 className="font-bold text-lg mb-4">Linguistic Rootwork</h3>
            <p className="text-text-light">Using cutting-edge AI, we trace the specific derivations of concepts from Proto-Indo-European (PIE) roots to the modern English vernacular.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Data Visualized</h3>
            <p className="text-text-light">We offer 10 distinct visualization modes, ranging from botanical tree diagrams to mathematical hierarchical edge bundling.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;