import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import RapierWorker from './RapierWorker.jsx'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RapierWorker />
    <App />
  </StrictMode>,
)
