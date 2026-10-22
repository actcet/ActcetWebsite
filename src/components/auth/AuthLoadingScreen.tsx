import React from "react";

export default function AuthLoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-[#070d1f] flex flex-col justify-center items-center px-4 relative overflow-hidden text-white font-body">
      <div className="absolute inset-0 bg-stars opacity-40 pointer-events-none" />
      <div className="w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-12 relative animate-bounce">
          <img
            src="/images/Actcet%20Images/IMP%20LOGO/ACTCET%20LOGO%20(1).png"
            alt="ACTCET Astronomy Club"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-light animate-ping" />
          <span className="font-label text-xs uppercase tracking-widest text-ink-soft">
            Verifying Mission Authorization...
          </span>
        </div>
      </div>
    </div>
  );
}
