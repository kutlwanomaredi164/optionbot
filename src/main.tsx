import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FirebaseAuthProvider } from './context/FirebaseAuthContext';

createRoot(document.getElementById('root')!).render(
  <FirebaseAuthProvider>
    <App />
  </FirebaseAuthProvider>
);
