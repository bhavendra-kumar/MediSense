import React from 'react';

const LoadingOverlay = ({ show = false, label = 'Processing...' }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 px-6 py-5 rounded-2xl bg-white/90 shadow-2xl border border-white/60">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 opacity-70 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-gray-800 tracking-wide">
          {label}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
