import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter as Router } from 'react-router-dom'
import App from './App'
import './index.css'

// Usa sempre /fit-tracker/ come base path
const BASE_PATH = '/fit-tracker'

// Funzione globale per ottenere il base URL completo
window.getBaseUrl = () => {
  return `${window.location.origin}${BASE_PATH}`;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)