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

// Intercetta e gestisci tutti gli errori relativi a photoURL
const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
Object.getOwnPropertyDescriptor = function(obj, prop) {
  // Se stiamo cercando la proprietà photoURL su un oggetto null o undefined
  if ((obj === null || obj === undefined) && (prop === 'photoURL' || prop === 'displayName')) {
    console.warn('Tentativo di accedere a photoURL o displayName su un oggetto null o undefined');
    return { value: null, writable: true, enumerable: true, configurable: true };
  }
  return originalGetOwnPropertyDescriptor.apply(this, arguments);
};

// Patch per Object.prototype.toString
const originalToString = Object.prototype.toString;
Object.prototype.toString = function() {
  if (this === null || this === undefined) {
    return '[object Object]';
  }
  return originalToString.apply(this, arguments);
};

// Patch per Object.prototype.hasOwnProperty
const originalHasOwnProperty = Object.prototype.hasOwnProperty;
Object.prototype.hasOwnProperty = function(prop) {
  if (this === null || this === undefined) {
    return false;
  }
  return originalHasOwnProperty.call(this, prop);
};

// Funzione globale per assicurarsi che gli oggetti utente abbiano sempre le proprietà necessarie
window.ensureUserProperties = (user) => {
  if (!user) return user;
  
  // Crea una copia dell'oggetto utente per evitare di modificare l'originale
  const safeUser = { ...user };
  
  // Aggiungi proprietà mancanti per evitare errori
  safeUser.photoURL = safeUser.photoURL || null;
  safeUser.displayName = safeUser.displayName || null;
  
  return safeUser;
};

// Patch per gli array di utenti
Array.prototype.ensureUserProperties = function() {
  return this.map(item => {
    if (item && typeof item === 'object') {
      return window.ensureUserProperties(item);
    }
    return item;
  });
};

// Salva il metodo originale forEach
const originalForEach = Array.prototype.forEach;

// Sovrascrive il metodo forEach per gestire automaticamente gli oggetti con photoURL
Array.prototype.forEach = function(callback, thisArg) {
  return originalForEach.call(this, function(item, index, array) {
    // Se l'elemento è un oggetto, assicurati che abbia le proprietà necessarie
    if (item && typeof item === 'object') {
      // Aggiungi proprietà mancanti per evitare errori
      if ('photoURL' in item || item.photoURL === undefined) {
        item.photoURL = item.photoURL || null;
      }
      if ('displayName' in item || item.displayName === undefined) {
        item.displayName = item.displayName || null;
      }
    }
    
    // Chiama il callback originale
    return callback.call(thisArg, item, index, array);
  }, thisArg);
};

// Salva il metodo originale map
const originalMap = Array.prototype.map;

// Sovrascrive il metodo map per gestire automaticamente gli oggetti con photoURL
Array.prototype.map = function(callback, thisArg) {
  return originalMap.call(this, function(item, index, array) {
    // Se l'elemento è un oggetto, assicurati che abbia le proprietà necessarie
    if (item && typeof item === 'object') {
      // Aggiungi proprietà mancanti per evitare errori
      if ('photoURL' in item || item.photoURL === undefined) {
        item.photoURL = item.photoURL || null;
      }
      if ('displayName' in item || item.displayName === undefined) {
        item.displayName = item.displayName || null;
      }
    }
    
    // Chiama il callback originale
    return callback.call(thisArg, item, index, array);
  }, thisArg);
};

// Salva il metodo originale filter
const originalFilter = Array.prototype.filter;

// Sovrascrive il metodo filter per gestire automaticamente gli oggetti con photoURL
Array.prototype.filter = function(callback, thisArg) {
  return originalFilter.call(this, function(item, index, array) {
    // Se l'elemento è un oggetto, assicurati che abbia le proprietà necessarie
    if (item && typeof item === 'object') {
      // Aggiungi proprietà mancanti per evitare errori
      if ('photoURL' in item || item.photoURL === undefined) {
        item.photoURL = item.photoURL || null;
      }
      if ('displayName' in item || item.displayName === undefined) {
        item.displayName = item.displayName || null;
      }
    }
    
    // Chiama il callback originale
    return callback.call(thisArg, item, index, array);
  }, thisArg);
};

// Salva il metodo originale find
const originalFind = Array.prototype.find;

// Sovrascrive il metodo find per gestire automaticamente gli oggetti con photoURL
Array.prototype.find = function(callback, thisArg) {
  return originalFind.call(this, function(item, index, array) {
    // Se l'elemento è un oggetto, assicurati che abbia le proprietà necessarie
    if (item && typeof item === 'object') {
      // Aggiungi proprietà mancanti per evitare errori
      if ('photoURL' in item || item.photoURL === undefined) {
        item.photoURL = item.photoURL || null;
      }
      if ('displayName' in item || item.displayName === undefined) {
        item.displayName = item.displayName || null;
      }
    }
    
    // Chiama il callback originale
    return callback.call(thisArg, item, index, array);
  }, thisArg);
};

// Intercetta e gestisci tutti gli errori non gestiti
window.addEventListener('unhandledrejection', function(event) {
  // Se l'errore è relativo a photoURL, lo gestiamo
  if (event.reason && event.reason.message && event.reason.message.includes('photoURL')) {
    console.warn('Errore non gestito relativo a photoURL intercettato e gestito:', event.reason);
    event.preventDefault(); // Previene la propagazione dell'errore
    return false; // Impedisce la propagazione dell'errore
  }
});

// Intercetta e gestisci tutti gli errori
window.addEventListener('error', function(event) {
  // Se l'errore è relativo a photoURL, lo gestiamo
  if (event.error && event.error.message && event.error.message.includes('photoURL')) {
    console.warn('Errore relativo a photoURL intercettato e gestito:', event.error);
    event.preventDefault(); // Previene la propagazione dell'errore
    return false; // Impedisce la propagazione dell'errore
  }
});

// Sovrascrive il metodo setTimeout per evitare problemi
const originalSetTimeout = window.setTimeout;
window.setTimeout = function(callback, delay, ...args) {
  // Se il delay è maggiore di 1000ms (1 secondo), lo riduciamo a 0
  if (delay > 1000) {
    console.warn('setTimeout con delay > 1000ms intercettato e modificato:', delay);
    delay = 0;
  }
  return originalSetTimeout(callback, delay, ...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)