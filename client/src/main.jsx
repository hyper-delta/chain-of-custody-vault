import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return <main><h1>Chain-of-Custody Vault</h1><p>Backend and React implementation in progress.</p></main>;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
