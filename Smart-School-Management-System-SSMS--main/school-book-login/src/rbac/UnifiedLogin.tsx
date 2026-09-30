import { useEffect } from 'react';
import { BookOpen } from 'lucide-react';

/**
 * The Book Animation Login (at `/`) is the ONLY authentication entry point.
 * Portals never render their own login — when unauthenticated they show this
 * glass panel for a beat, then hand off to the book.
 */
export function UnifiedLoginRedirect({ portal }: { portal: string }) {
  useEffect(() => {
    const t = setTimeout(() => { window.location.hash = ''; }, 1400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center p-4 gf-bg">
      <div className="glass-panel rounded-3xl p-10 max-w-sm w-full text-center text-white">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl glass-chip flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-sky-200" />
        </div>
        <h1 className="text-xl font-bold">Sign in required</h1>
        <p className="text-sm text-white/70 mt-2">
          {portal} uses the unified <b>Book Login</b>. Taking you there…
        </p>
        <div className="mt-6 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400 animate-[gfslide_1.4s_ease-in-out_forwards]" />
        </div>
        <button onClick={() => { window.location.hash = ''; }} className="mt-5 text-xs font-bold text-sky-200 hover:text-white transition-colors">
          Open Book Login now →
        </button>
      </div>
    </div>
  );
}
