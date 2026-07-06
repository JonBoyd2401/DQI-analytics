import React from 'react';
import { createRoot } from 'react-dom/client';
import { DqiAuditStudio } from './DqiAuditStudio.js';
import './dqi-studio.css';
import './refine.css';
import './legal.css';
import { LegalNotice } from './LegalNotice.js';
import { ThemeToggle } from './ThemeToggle.js';

createRoot(document.getElementById('root')!).render(<React.StrictMode><DqiAuditStudio /><LegalNotice /><ThemeToggle /></React.StrictMode>);
