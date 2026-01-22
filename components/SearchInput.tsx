
import React, { useState } from 'react';

interface SearchInputProps {
  onBloom: (word: string) => void;
  isLoading: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({ onBloom, isLoading }) => {
  const [word, setWord] = useState<string>('');

  const handleBloom = () => {
    if (word.trim() !== '') {
      onBloom(word);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleBloom();
    }
  };

  return (
    <div className="relative w-full max-w-xl bg-white border border-black/10 rounded-2xl p-1.5 flex flex-wrap sm:flex-nowrap items-center shadow-soft transition-all duration-300 ease focus-within:translate-y-[-2px] focus-within:shadow-deep focus-within:border-accent-green gap-2">
      <input
        type="text"
        id="wordInput"
        placeholder="Enter a word (e.g., 'Magic', 'Garden')..."
        className="flex-1 min-w-[150px] border-none outline-none px-4 py-3 font-sans text-base text-text-ink bg-transparent placeholder-text-light/50"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
      />
      <button
        id="bloomBtn"
        onClick={handleBloom}
        className={`bg-accent-terra text-white px-6 py-3 rounded-xl font-semibold cursor-pointer transition-all duration-300 flex items-center gap-2 whitespace-nowrap justify-center flex-shrink-0
                    ${isLoading ? 'opacity-60 cursor-not-allowed bg-accent-green' : 'hover:bg-[#a86550] hover:shadow-md active:scale-95'}`}
        disabled={isLoading}
      >
        <span>{isLoading ? 'Blooming...' : 'Bloom'}</span>
        {!isLoading && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default SearchInput;