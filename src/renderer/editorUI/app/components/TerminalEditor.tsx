import { useState, useEffect } from "react";
import { SpawnMenuPanel } from "./SpawnMenuPanel";
import { HUDPanel } from "./HUDPanel";
import { PropertiesPanel } from "./PropertiesPanel";
import { TopToolbar } from "./TopToolbar";
import { BottomInfo } from "./BottomInfo";
import { editorBridge, TransformData, EditorTool } from "../../../editor/editor-bridge";

const DEFAULT_TRANSFORM: TransformData = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

export function TerminalEditor() {
  const [activeTab, setActiveTab] = useState("Lights");
  const [activeTool, setActiveTool] = useState<string>("Move");
  const [selectedModel, setSelectedModel] = useState("");
  const [transform, setTransform] = useState<TransformData>(DEFAULT_TRANSFORM);
  const [editorMode, setEditorMode] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(false);

  useEffect(() => {
    const onModeChanged = ({ active }: { active: boolean }) => {
      setEditorMode(active);
    };

    const onToolChanged = ({ tool }: { tool: EditorTool }) => {
      setActiveTool(tool);
    };

    const onObjectSelected = ({ object }: { object: { name: string; transform: TransformData } | null }) => {
      if (object) {
        setSelectedModel(object.name);
        setTransform(object.transform);
      } else {
        setSelectedModel("");
        setTransform(DEFAULT_TRANSFORM);
      }
    };

    const onTransformChanged = ({ transform: t }: { transform: TransformData }) => {
      setTransform({ ...t });
    };

    const onGridToggled = ({ enabled }: { enabled: boolean }) => {
      setGridEnabled(enabled);
    };

    editorBridge.on('mode-changed', onModeChanged);
    editorBridge.on('tool-changed', onToolChanged);
    editorBridge.on('object-selected', onObjectSelected);
    editorBridge.on('transform-changed', onTransformChanged);
    editorBridge.on('grid-toggled', onGridToggled);

    return () => {
      editorBridge.off('mode-changed', onModeChanged);
      editorBridge.off('tool-changed', onToolChanged);
      editorBridge.off('object-selected', onObjectSelected);
      editorBridge.off('transform-changed', onTransformChanged);
      editorBridge.off('grid-toggled', onGridToggled);
    };
  }, []);

  const handleSetActiveTool = (tool: string) => {
    editorBridge.selectTool(tool as EditorTool);
  };

  const handleSave = () => {
    editorBridge.saveLayout();
  };

  if (!editorMode) return null;

  return (
    <div className="w-full h-full relative font-mono select-none overflow-hidden pointer-events-none">
      <TopToolbar onSave={handleSave} />
      <div className="absolute inset-0 pt-[64px] pointer-events-none">
        <SpawnMenuPanel activeTab={activeTab} setActiveTab={setActiveTab} />
        <HUDPanel activeTool={activeTool} setActiveTool={handleSetActiveTool} transform={transform} setTransform={setTransform} gridEnabled={gridEnabled} />
        <PropertiesPanel selectedModel={selectedModel} transform={transform} setTransform={setTransform} />
      </div>
      <BottomInfo />
    </div>
  );
}
