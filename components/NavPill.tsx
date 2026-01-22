import React from 'react';

const NavPill: React.FC = () => {
  return (
    <nav className="fixed top-8 left-1/2 -translate-x-1/2 bg-dark-bg p-3 px-6 rounded-full flex items-center gap-6 text-white z-50 shadow-lg text-sm font-medium
                    md:top-8 md:p-3 md:px-6 md:gap-6
                    sm:top-4 sm:w-[90%] sm:justify-between sm:p-2 sm:px-4 sm:gap-4">
      <div className="flex items-center gap-2 font-serif italic text-lg sm:text-base">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <span>Etymos</span>
      </div>
      <div className="flex gap-4 sm:gap-2">
        <button className="text-white/70 hover:text-white transition-colors text-sm sm:text-xs bg-transparent border-none cursor-pointer">About</button>
        <button className="text-white/70 hover:text-white transition-colors text-sm sm:text-xs bg-transparent border-none cursor-pointer">Garden</button>
        <button className="text-white/70 hover:text-white transition-colors text-sm sm:text-xs bg-transparent border-none cursor-pointer">Login</button>
      </div>
    </nav>
  );
};

export default NavPill;