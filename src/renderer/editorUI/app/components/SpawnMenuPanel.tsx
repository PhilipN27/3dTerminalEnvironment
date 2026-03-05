import { useState } from "react";
import { Search, Lightbulb, Hexagon, Box } from "lucide-react";
import { editorBridge, SpawnableModel } from "../../../editor/editor-bridge";

const CATEGORY_ICONS: Record<string, typeof Lightbulb> = {
  Lights: Lightbulb,
  Walls: Hexagon,
  Props: Box,
  Effects: Box,
};

const CATEGORY_COLORS: Record<string, string> = {
  Lights: "text-[#FFCC66]",
  Walls: "text-[#A0B0C0]",
  Props: "text-[#64C8FF]",
  Effects: "text-[#CC9966]",
};

export function SpawnMenuPanel({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const tabs = ["Lights", "Walls", "Props", "Effects"];
  const [hovered, setHovered] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const models = editorBridge.availableModels.filter(
    (m) => m.category === activeTab && m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSpawn = (model: SpawnableModel) => {
    editorBridge.spawnModel(model.path);
  };

  return (
    <div className="absolute left-8 top-16 pointer-events-auto flex gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-[#C0D0E0] text-sm tracking-wider uppercase mb-1 drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">Spawn Menu Panel</h2>
        <div className="bg-[#0A0F1E]/85 border border-[#64C8FF]/30 rounded-lg w-[320px] p-2 flex flex-col gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(100,200,255,0.1)]">

          {/* Tabs */}
          <div className="flex w-full">
            {tabs.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1 text-xs text-center border-t border-l border-r rounded-t-md transition-colors ${
                  activeTab === tab
                    ? "border-[#FF8C42] text-[#FF8C42] bg-[rgba(255,140,66,0.1)] shadow-[0_-2px_10px_rgba(255,140,66,0.2)] z-10"
                    : "border-[#64C8FF]/30 text-[#64C8FF] hover:bg-[#64C8FF]/10"
                } ${idx > 0 && activeTab !== tab && activeTab !== tabs[idx-1] ? "-ml-[1px]" : ""}`}
                style={{ marginBottom: activeTab === tab ? "-1px" : "0" }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className={`p-2 border border-[#64C8FF]/30 rounded-b-md rounded-tr-md ${activeTab !== 'Lights' ? 'rounded-tl-md' : ''}`}>
            {/* Search */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search models..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#050812]/80 border border-[#64C8FF]/30 rounded px-2 py-1 text-xs text-[#FF8C42] focus:outline-none focus:border-[#64C8FF] placeholder:text-[#C0D0E0]/50"
              />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-2">
              {models.map((model, idx) => {
                const isHovered = hovered === idx;
                const Icon = CATEGORY_ICONS[model.category] || Box;
                const colorClass = CATEGORY_COLORS[model.category] || "text-[#C0D0E0]";
                return (
                  <button
                    key={model.path}
                    onClick={() => handleSpawn(model)}
                    onMouseEnter={() => setHovered(idx)}
                    onMouseLeave={() => setHovered(null)}
                    className={`flex flex-col items-center justify-center p-2 rounded bg-[#0A0F1E] transition-all duration-200 border ${
                      isHovered ? "border-[#64C8FF] scale-105 shadow-[0_0_10px_rgba(100,200,255,0.4)]" : "border-[#64C8FF]/30"
                    }`}
                  >
                    <div className="h-10 flex items-center justify-center">
                      <Icon className={`w-6 h-6 ${colorClass} drop-shadow-[0_0_8px_currentColor]`} />
                    </div>
                    <span className="text-[9px] text-center text-[#C0D0E0] truncate w-full mt-1">
                      {model.name}
                    </span>
                  </button>
                );
              })}
              {models.length === 0 && (
                <div className="col-span-4 text-center text-xs text-[#C0D0E0]/50 py-4">
                  No models in this category
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
