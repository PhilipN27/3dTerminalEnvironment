import { Move, RotateCw, Maximize, Grid3x3 } from "lucide-react";
import { TransformData, editorBridge } from "../../../editor/editor-bridge";

export function HUDPanel({
  activeTool,
  setActiveTool,
  transform,
  gridEnabled,
}: {
  activeTool: string,
  setActiveTool: (t: string) => void,
  transform: TransformData,
  setTransform: (t: TransformData) => void,
  gridEnabled: boolean,
}) {

  const tools = [
    { id: "Move", icon: Move, label: "Move (G)" },
    { id: "Rotate", icon: RotateCw, label: "Rotate (R)" },
    { id: "Scale", icon: Maximize, label: "Scale (S)" },
  ];

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-auto">

      {/* Tool Buttons */}
      <div className="flex flex-col items-center">
        <h2 className="text-[#64C8FF] text-xs font-bold tracking-widest uppercase mb-2 drop-shadow-[0_0_4px_rgba(100,200,255,0.8)]">Editor Mode</h2>
        <div className="bg-[#0A0F1E]/85 border border-[#64C8FF]/30 rounded-lg p-2 backdrop-blur-md shadow-[0_0_15px_rgba(100,200,255,0.1)] flex gap-2">
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded transition-all ${
                activeTool === tool.id
                  ? "bg-[rgba(255,140,66,0.2)] border border-[#FF8C42] shadow-[0_0_10px_rgba(255,140,66,0.3)]"
                  : "bg-[#0A0F1E] border border-[#64C8FF]/30 hover:border-[#64C8FF] hover:bg-[#64C8FF]/10"
              }`}
            >
              <tool.icon className={`w-5 h-5 ${activeTool === tool.id ? "text-[#FF8C42]" : "text-[#64C8FF]"}`} />
              <span className={`text-[10px] mt-1 ${activeTool === tool.id ? "text-[#FF8C42]" : "text-[#C0D0E0]"}`}>
                {tool.label}
              </span>
            </button>
          ))}
          <div className="w-px bg-[#64C8FF]/30 mx-1" />
          <button
            onClick={() => editorBridge.toggleGrid()}
            className={`flex flex-col items-center justify-center min-w-[50px] h-[50px] rounded transition-all ${
              gridEnabled
                ? "bg-[rgba(100,200,255,0.2)] border border-[#64C8FF] shadow-[0_0_10px_rgba(100,200,255,0.3)]"
                : "bg-[#0A0F1E] border border-[#64C8FF]/30 hover:border-[#64C8FF] hover:bg-[#64C8FF]/10"
            }`}
          >
            <Grid3x3 className={`w-5 h-5 ${gridEnabled ? "text-[#64C8FF]" : "text-[#64C8FF]/50"}`} />
            <span className={`text-[10px] mt-1 ${gridEnabled ? "text-[#64C8FF]" : "text-[#C0D0E0]"}`}>
              Grid
            </span>
          </button>
        </div>
      </div>

      {/* Transform Readout */}
      <div className="mt-80">
        <div className="bg-[#0A0F1E]/85 border border-[#64C8FF]/30 rounded-lg p-4 backdrop-blur-md shadow-[0_0_15px_rgba(100,200,255,0.1)] flex flex-col gap-3 text-xs">

          <div className="flex items-center gap-2">
            <span className="w-24 text-[#C0D0E0]">Position XYZ:</span>
            <input type="text" value={transform.position.x.toFixed(2)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
            <input type="text" value={transform.position.y.toFixed(2)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
            <input type="text" value={transform.position.z.toFixed(2)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-24 text-[#C0D0E0]">Rotation XYZ:</span>
            <input type="text" value={transform.rotation.x.toFixed(1)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
            <input type="text" value={transform.rotation.y.toFixed(1)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
            <input type="text" value={transform.rotation.z.toFixed(1)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-24 text-[#C0D0E0]">Scale XYZ:</span>
            <input type="text" value={transform.scale.x.toFixed(2)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
            <input type="text" value={transform.scale.y.toFixed(2)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
            <input type="text" value={transform.scale.z.toFixed(2)} readOnly className="w-16 bg-black border border-[#64C8FF]/30 text-[#FF8C42] text-center rounded py-1" />
          </div>

        </div>
      </div>

    </div>
  );
}
