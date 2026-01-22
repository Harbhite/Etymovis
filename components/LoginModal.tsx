import React from 'react';

const LoginModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-dark-bg/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-deep relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-text-light hover:text-text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <h2 className="font-serif text-3xl mb-2 text-center">Curator Sign-in</h2>
        <p className="text-sm text-text-light text-center mb-8">Access your private linguistic library.</p>
        <form className="space-y-4">
          <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border border-gray-200" />
          <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border border-gray-200" />
          <button className="w-full bg-accent-green text-white p-3 rounded-xl font-bold hover:bg-sage transition-colors">Enter Archives</button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center text-xs text-text-light">
          <span>Need a membership?</span>
          <button className="text-accent-terra font-bold">Apply as Scholar</button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;