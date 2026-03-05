import React from "react";

export function BottomInfo() {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[400px] h-[36px] bg-[#0A0F1E]/85 border border-[#64C8FF]/30 rounded-full flex items-center justify-between px-6 backdrop-blur-md z-50 pointer-events-auto shadow-[0_-4px_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4 text-[10px] text-[#C0D0E0]">
        <span className="flex items-center gap-1">
          <kbd className="bg-[#64C8FF]/20 px-1.5 py-0.5 rounded border border-[#64C8FF]/30 text-[#64C8FF]">E</kbd>
          Toggle Editor
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-[#64C8FF]/20 px-1.5 py-0.5 rounded border border-[#64C8FF]/30 text-[#64C8FF]">G/R/S</kbd>
          Gizmo
        </span>
        <span className="flex items-center gap-1">
          <kbd className="bg-[#64C8FF]/20 px-1.5 py-0.5 rounded border border-[#64C8FF]/30 text-[#64C8FF]">Esc</kbd>
          Deselect
        </span>
      </div>
    </div>
  );
}
