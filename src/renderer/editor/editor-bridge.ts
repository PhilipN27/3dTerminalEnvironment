export interface TransformData {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

export interface SelectedObjectInfo {
  name: string;
  transform: TransformData;
}

export interface SpawnableModel {
  name: string;
  path: string;
  category: string;
}

export type EditorTool = 'Move' | 'Rotate' | 'Scale';

type EditorEventMap = {
  'mode-changed': { active: boolean };
  'tool-changed': { tool: EditorTool };
  'object-selected': { object: SelectedObjectInfo | null };
  'transform-changed': { transform: TransformData };
  'spawn-request': { modelPath: string };
  'delete-request': {};
  'save-request': {};
  'deselect-request': {};
};

type EditorEventType = keyof EditorEventMap;
type EditorEventCallback<T extends EditorEventType> = (data: EditorEventMap[T]) => void;

class EditorBridge {
  active = false;
  activeTool: EditorTool = 'Move';
  selectedObject: SelectedObjectInfo | null = null;
  availableModels: SpawnableModel[] = [];

  private listeners = new Map<string, Set<Function>>();

  on<T extends EditorEventType>(event: T, callback: EditorEventCallback<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off<T extends EditorEventType>(event: T, callback: EditorEventCallback<T>) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit<T extends EditorEventType>(event: T, data: EditorEventMap[T]) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  // --- React → Three.js ---

  selectTool(tool: EditorTool) {
    this.activeTool = tool;
    this.emit('tool-changed', { tool });
  }

  spawnModel(modelPath: string) {
    this.emit('spawn-request', { modelPath });
  }

  deleteSelected() {
    this.emit('delete-request', {});
  }

  saveLayout() {
    this.emit('save-request', {});
  }

  deselect() {
    this.emit('deselect-request', {});
  }

  // --- Three.js → React ---

  setActive(active: boolean) {
    this.active = active;
    this.emit('mode-changed', { active });
  }

  setSelectedObject(object: SelectedObjectInfo | null) {
    this.selectedObject = object;
    this.emit('object-selected', { object });
  }

  setTransform(transform: TransformData) {
    if (this.selectedObject) {
      this.selectedObject.transform = transform;
    }
    this.emit('transform-changed', { transform });
  }
}

export const editorBridge = new EditorBridge();
