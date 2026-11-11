import React from 'react';

export default function AuroraBackground({ theme = 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden -z-10 transition-colors duration-700 ${
      isDark ? 'bg-[#07080f]' : 'bg-[#f5f8fc]'
    }`}>
      {/* Subtle Grid Overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${isDark ? 'opacity-[0.03]' : 'opacity-[0.02]'}`} 
        style={{
          backgroundImage: isDark
            ? `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`
            : `linear-gradient(to right, #0f172a 1px, transparent 1px), linear-gradient(to bottom, #0f172a 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Floating Aurora / Liquid Glow Elements */}
      {isDark ? (
        <>
          <div className="absolute -top-[20%] -left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-purple-600/25 via-indigo-600/15 to-transparent blur-[120px] animate-pulse transition-all duration-1000" />
          <div className="absolute top-[35%] -right-[15%] w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-cyan-500/20 via-blue-600/10 to-transparent blur-[130px] transition-all duration-1000" />
          <div className="absolute -bottom-[20%] left-[25%] w-[700px] h-[700px] rounded-full bg-gradient-to-t from-emerald-600/15 via-purple-700/10 to-transparent blur-[140px]" />
          <div className="absolute top-[10%] left-[45%] w-[400px] h-[400px] rounded-full bg-amber-500/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,8,15,0.7)_100%)]" />
        </>
      ) : (
        /* LIQUID GLASS LIGHT MODE: Fluid water ripples & Prismatic refraction highlights */
        <>
          {/* Aqua Cyan Water Ripple */}
          <div className="absolute -top-[15%] -left-[5%] w-[680px] h-[680px] rounded-full bg-gradient-to-br from-cyan-100/60 via-sky-100/45 to-transparent blur-[120px] transition-all duration-1000" />
          {/* Soft Royal Azure Pool */}
          <div className="absolute top-[25%] -right-[12%] w-[620px] h-[620px] rounded-full bg-gradient-to-bl from-indigo-100/55 via-blue-100/40 to-transparent blur-[130px] transition-all duration-1000" />
          {/* Delicate Champagne Shimmer */}
          <div className="absolute -bottom-[15%] left-[20%] w-[700px] h-[700px] rounded-full bg-gradient-to-t from-amber-50/60 via-sky-50/40 to-transparent blur-[140px]" />
          {/* Pure Light Caustic Flare */}
          <div className="absolute top-[10%] left-[40%] w-[450px] h-[450px] rounded-full bg-emerald-50/40 blur-[100px]" />
          {/* Fluid Vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(245,248,252,0.4)_100%)]" />
        </>
      )}
    </div>
  );
}
