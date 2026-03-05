import { Save } from "lucide-react";

export function TopToolbar({ onSave }: { onSave: () => void }) {
  return (
    <div className="absolute top-0 left-0 w-full h-[48px] bg-[#0A0F1E]/85 border-b border-[#64C8FF]/30 flex items-center justify-between px-6 backdrop-blur-md z-50 pointer-events-auto shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-6">
        <h1 className="text-[#64C8FF] text-sm font-bold tracking-widest uppercase">3D Terminal Environment</h1>
        <div className="flex items-center gap-4 text-xs text-[#C0D0E0]">
          <button onClick={onSave} className="hover:text-[#FF8C42] transition-colors flex items-center gap-1">
            <Save className="w-3 h-3" />
            Save Layout
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-[#FF8C42] px-2 py-1 bg-[rgba(255,140,66,0.1)] border border-[#FF8C42]/50 rounded">Editor Mode Active</span>
      </div>
    </div>
  );
}
