import React, { useEffect } from 'react';

const baseColors = {
  success: 'bg-emerald-500/90 border-emerald-400 text-white',
  error: 'bg-rose-500/90 border-rose-400 text-white',
  warning: 'bg-amber-500/90 border-amber-400 text-white',
  info: 'bg-sky-500/90 border-sky-400 text-white',
};

const iconMap = {
  success: '✔',
  error: '⚠',
  warning: '!',
  info: 'ℹ',
};

const Alert = ({
  type = 'info',
  message = '',
  show = false,
  autoCloseMs = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (!show || !autoCloseMs) return;
    const timer = setTimeout(() => {
      onClose && onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [show, autoCloseMs, onClose]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 pt-6 sm:pt-8 md:pt-10 transition-all duration-500 ease-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      aria-live="assertive"
    >
      <div
        className={`pointer-events-auto relative max-w-md w-full rounded-2xl border shadow-2xl shadow-black/20 backdrop-blur-md overflow-hidden transform transition-all duration-500 ${
          show ? 'scale-100' : 'scale-95'
        } ${baseColors[type] || baseColors.info}`}
      >
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#ffffff33,_transparent_60%)]" />
        <div className="relative flex items-start gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">
            <span>{iconMap[type] || iconMap.info}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm sm:text-base font-medium leading-snug drop-shadow-sm">
              {message}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-sm transition focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              ✕
            </button>
          )}
        </div>

        {/* bottom progress bar */}
        {autoCloseMs && show && (
          <div className="relative h-1 w-full overflow-hidden bg-black/10">
            <div
              className="absolute inset-y-0 left-0 w-full origin-left bg-white/70 animate-[alert-progress_linear]"
              style={{ animationDuration: `${autoCloseMs}ms` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
