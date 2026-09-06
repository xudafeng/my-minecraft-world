import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Game from '../app/world-game';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Game />
  </StrictMode>,
);
