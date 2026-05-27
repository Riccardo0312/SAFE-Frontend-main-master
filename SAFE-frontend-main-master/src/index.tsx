import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import "./theme/variables.css";
// 2. Ottieni l'elemento DOM (container)
const container = document.getElementById('root');

// 3. Verifica l'esistenza del container (necessario per TypeScript)
if (container) {
    // 4. Crea la radice (root) con la nuova API
    const root = ReactDOMClient.createRoot(container);

    // 5. Renderizza il componente principale sulla radice
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
} else {
    // Gestione di errore nel caso l'ID 'root' non sia trovato
    console.error("Root element not found in index.html");
}


// Il resto del codice rimane invariato
serviceWorkerRegistration.unregister();

reportWebVitals();