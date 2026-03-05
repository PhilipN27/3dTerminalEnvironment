import { useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { editorBridge, TransformData } from "../../../editor/editor-bridge";

export function PropertiesPanel({
  selectedModel,
  transform,
}: {
  selectedModel: string,
  transform: TransformData,
  setTransform: (t: TransformData) => void
}) {
  const [openSections, setOpenSections] = useState({
    transform: true,
    actions: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SliderRow = ({ label, value }: { label: string, value: number }) => (
    <div className="flex items-center gap-3 w-full">
      <span className="text-[#C0D0E0] w-4 text-xs">{label}</span>
      <div className="flex-1 relative h-1.5 bg-[#050812] border border-[#64C8FF]/30 rounded-full flex items-center">
        <div
          className="absolute left-0 h-full bg-[#FF8C42] rounded-full"
          style={{ width: `${Math.min(Math.abs(value) / 20 * 100, 100)}%` }}
        />
      </div>
      <input
        type="text"
        readOnly
        value={value.toFixed(2)}
        className="w-14 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center text-xs rounded py-0.5 focus:outline-none"
      />
    </div>
  );

  return (
    <div className="absolute right-8 top-16 pointer-events-auto flex flex-col gap-2 w-[300px]">
      <h2 className="text-[#C0D0E0] text-sm tracking-wider uppercase mb-1 drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">Properties Inspector</h2>
      <div className="bg-[#0A0F1E]/85 border border-[#64C8FF]/30 rounded-lg p-3 backdrop-blur-md shadow-[0_0_15px_rgba(100,200,255,0.1)] flex flex-col gap-4">

        {/* Object Name */}
        <div className="flex items-center gap-2">
          <span className="text-[#C0D0E0] text-xs">Object:</span>
          <span className="text-[#FF8C42] text-xs">{selectedModel ? `[${selectedModel}]` : 'None selected'}</span>
        </div>

        {/* Transform Section */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection('transform')}
            className="flex items-center gap-1 text-[#64C8FF] text-xs font-semibold uppercase mb-2 hover:text-white transition-colors"
          >
            {openSections.transform ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Transform
          </button>

          {openSections.transform && (
            <div className="pl-4 flex flex-col gap-3 pb-2 border-b border-[#64C8FF]/30">
              <div className="text-[10px] text-[#64C8FF] uppercase tracking-wider">Position</div>
              <SliderRow label="X" value={transform.position.x} />
              <SliderRow label="Y" value={transform.position.y} />
              <SliderRow label="Z" value={transform.position.z} />

              <div className="text-[10px] text-[#64C8FF] uppercase tracking-wider mt-2">Rotation</div>
              <SliderRow label="X" value={transform.rotation.x} />
              <SliderRow label="Y" value={transform.rotation.y} />
              <SliderRow label="Z" value={transform.rotation.z} />

              <div className="text-[10px] text-[#64C8FF] uppercase tracking-wider mt-2">Scale</div>
              <SliderRow label="X" value={transform.scale.x} />
              <SliderRow label="Y" value={transform.scale.y} />
              <SliderRow label="Z" value={transform.scale.z} />
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex flex-col">
          <button
            onClick={() => toggleSection('actions')}
            className="flex items-center gap-1 text-[#64C8FF] text-xs font-semibold uppercase mb-2 hover:text-white transition-colors"
          >
            {openSections.actions ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Actions
          </button>

          {openSections.actions && (
            <div className="pl-4 flex gap-2">
              <button
                onClick={() => editorBridge.deleteSelected()}
                disabled={!selectedModel}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
