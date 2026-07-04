import { useEffect, useRef, useState } from 'react';

const products = [
  { id: 'home', name: 'DQI Home', description: 'Platform overview, products and access', href: import.meta.env.VITE_DQI_HOME_URL || 'https://www.getdqi.com', accent: '#f8fafc' },
  { id: 'explore', name: 'Explore DQI', description: 'Interactive framework wheel and standards', href: import.meta.env.VITE_DQI_EXPLORE_URL || '/dqi-wheel.html', accent: '#d879ff' },
  { id: 'assess', name: 'DQI Assess', description: 'Start a maturity and readiness assessment', href: import.meta.env.VITE_DQI_ASSESS_URL || 'https://dqi-assess-s7sp.onrender.com/assessment/welcome', accent: '#ffd166' },
  { id: 'enforce', name: 'DQI Enforce', description: 'Explore runtime policy controls', href: import.meta.env.VITE_DQI_ENFORCE_URL || 'https://dqi-enforce-demo.onrender.com', accent: '#51e4bb' },
  { id: 'analytics', name: 'DQI Analytics', description: 'Turn governed evidence into audit reporting', href: '/', accent: '#809dff' },
] as const;

export function DqiPlatformNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="platform-switcher" ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button type="button" className="platform-switcher-button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <span className="switcher-grid" aria-hidden="true"><i /><i /><i /><i /></span>
        DQI products
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      <a className="platform-switcher-button" href="mailto:dqi@q4it.eu?subject=DQI%20solution%20access">Contact us</a>
      {open && (
        <div className="platform-menu" role="menu">
          <header><div><strong>DQI platform</strong><small>One framework. Four connected products.</small></div><span>DEMO ACCESS</span></header>
          <div className="platform-products">
            {products.map((product) => {
              const active = product.id === 'analytics';
              return (
                <a key={product.id} role="menuitem" href={product.href} aria-current={active ? 'page' : undefined} className={active ? 'active' : undefined}>
                  <i style={{ background: product.accent, boxShadow: `0 0 15px ${product.accent}55` }} />
                  <span><strong>{product.name}</strong><small>{product.description}</small></span>
                  <b>{active ? 'Current' : 'Open →'}</b>
                </a>
              );
            })}
          </div>
          <footer>Demo workspace includes all products. Production access is controlled per tenant and subscription. <a style={{ color: '#57e3bc', fontWeight: 700 }} href="mailto:dqi@q4it.eu?subject=DQI%20solution%20access">Contact us for access →</a></footer>
        </div>
      )}
    </div>
  );
}
