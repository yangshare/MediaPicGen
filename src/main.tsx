import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ToastProvider } from './components/Toast'
import { EditorStoreProvider } from './features/ai-editing/hooks/useEditorStore'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <EditorStoreProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </EditorStoreProvider>
  </React.StrictMode>,
)
