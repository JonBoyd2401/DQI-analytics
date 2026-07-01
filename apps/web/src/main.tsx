import React from 'react';
import { createRoot } from 'react-dom/client';
import { DqiAuditStudio } from './DqiAuditStudio.js';
import './dqi-studio.css';
import './refine.css';

createRoot(document.getElementById('root')!).render(<React.StrictMode><DqiAuditStudio /></React.StrictMode>);
