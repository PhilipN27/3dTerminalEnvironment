import { createRoot } from 'react-dom/client';
import App from '../editorUI/app/App';
import '../editorUI/styles/index.css';

const container = document.getElementById('editor-root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
