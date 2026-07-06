import { useEffect, useState } from 'react';

export type DqiTheme = 'dark' | 'light';
const storageKey = 'dqi-theme';
const eventName = 'dqi-theme-change';

function validTheme(value: string | null): value is DqiTheme {
  return value === 'dark' || value === 'light';
}

function readTheme(): DqiTheme {
  const requested = new URLSearchParams(window.location.search).get('theme');
  if (validTheme(requested)) return requested;
  try {
    const stored = localStorage.getItem(storageKey);
    if (validTheme(stored)) return stored;
  } catch { /* Use the platform default when storage is unavailable. */ }
  return 'dark';
}

function applyTheme(theme: DqiTheme, persist = false) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#07111f' : '#f5f8fc');
  if (persist) {
    try { localStorage.setItem(storageKey, theme); } catch { /* Theme still applies to this page. */ }
  }
}

const initialTheme = readTheme();
applyTheme(initialTheme, Boolean(new URLSearchParams(window.location.search).get('theme')));

export function useDqiTheme() {
  const [theme, setThemeState] = useState<DqiTheme>(initialTheme);
  useEffect(() => {
    const update = (event: Event) => setThemeState((event as CustomEvent<DqiTheme>).detail);
    const syncStorage = (event: StorageEvent) => {
      if (event.key === storageKey && validTheme(event.newValue)) {
        applyTheme(event.newValue);
        setThemeState(event.newValue);
      }
    };
    window.addEventListener(eventName, update);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener(eventName, update);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);
  const setTheme = (next: DqiTheme) => {
    applyTheme(next, true);
    window.dispatchEvent(new CustomEvent<DqiTheme>(eventName, { detail: next }));
  };
  return { theme, setTheme };
}

export function themedHref(href: string, theme: DqiTheme) {
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return href;
  try {
    const url = new URL(href, window.location.origin);
    url.searchParams.set('theme', theme);
    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : url.toString();
  } catch {
    return href;
  }
}

export function ThemeToggle() {
  const { theme, setTheme } = useDqiTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return <button type="button" className="dqi-theme-toggle" aria-label={`Use ${next} theme`} title={`Use ${next} theme`} onClick={() => setTheme(next)}>
    <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span><span>{next === 'light' ? 'Light' : 'Dark'}</span>
  </button>;
}
