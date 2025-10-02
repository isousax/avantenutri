import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import Button from '../components/ui/Button';
import { SEO } from '../components/comum/SEO';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { useI18n } from '../i18n';
import { API } from '../config/api';
import type { TranslationKey } from '../types/i18n.d';

interface BaseNavItem { path: string; labelKey: TranslationKey; icon?: React.ReactNode; requiresRole?: string; groupId?: string; }
interface NavItem extends BaseNavItem { label: string; }

const icon = (d: string) => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
const baseNavItems: BaseNavItem[] = [
  { path: '/admin', labelKey: 'admin.nav.dashboard', icon: icon('M3 13h2a2 2 0 0 0 2-2V5h3v3a2 2 0 0 0 2 2h2V5h3v6a4 4 0 0 1-4 4h-3v3h3v2H9v-5H7a4 4 0 0 1-4-4Z') },
  { path: '/admin/usuarios', labelKey: 'admin.nav.users', icon: icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4m7-1 3 3m0 0 3-3m-3 3V4'), requiresRole: 'admin' },
  { path: '/admin/consultas', labelKey: 'admin.nav.consultations', icon: icon('M8 7V3h8v4M3 11h18M5 11v9h14v-9'), requiresRole: 'admin' },
  { path: '/admin/billing', labelKey: 'admin.nav.billing', icon: icon('M3 5h18M3 10h18M3 15h18M5 20h14'), requiresRole: 'admin' },
  { path: '/admin/relatorios', labelKey: 'admin.nav.reports', icon: icon('M3 3h18v4H3V3Zm0 6h18v12H3V9Zm4 3v6m5-6v6m5-6v6'), requiresRole: 'admin' },
  { path: '/admin/blog', labelKey: 'admin.nav.posts', icon: icon('M4 19.5 9.5 14m5-5L20 4m-9 1h7v7M5 4h5v5H5V4Zm0 10h5v5H5v-5Z'), groupId: 'content', requiresRole: 'admin' },
  { path: '/admin/blog/new', labelKey: 'admin.nav.postNew', icon: icon('M12 5v14m-7-7h14'), groupId: 'content', requiresRole: 'admin' },
  { path: '/admin/audit', labelKey: 'admin.nav.audit', icon: icon('M5 21h14M5 3h14M9 7v10M15 7v10'), requiresRole: 'admin' },
];

interface Metric { key: string; label: string; value: number | null; loading?: boolean; }

const AdminLayout: React.FC = () => {
  const { user, logout, authenticatedFetch } = useAuth();
  const { t } = useI18n();
  // Translate nav items (memoized on locale change)
  const navItems: NavItem[] = useMemo(() => baseNavItems.map(n => ({ ...n, label: t(n.labelKey) })), [t]);
  const location = useLocation();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metric[]>([
    { key: 'users', label: t('admin.metrics.users'), value: null, loading: true },
    { key: 'consultsUpcoming', label: t('admin.metrics.consultsUpcoming'), value: null, loading: true },
    { key: 'posts', label: t('admin.metrics.posts'), value: null, loading: true },
  ]);
  // Update metric labels if locale changes
  useEffect(() => {
    setMetrics(m => m.map(mm => {
      switch (mm.key) {
        case 'users': return { ...mm, label: t('admin.metrics.users') };
        case 'consultsUpcoming': return { ...mm, label: t('admin.metrics.consultsUpcoming') };
        case 'posts': return { ...mm, label: t('admin.metrics.posts') };
        default: return mm;
      }
    }));
  }, [t]);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const commandRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const { push } = useToast();
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Collapsible groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const LS_GROUP_KEY = 'admin.sidebar.collapsedGroups';
  // Load persisted collapsed groups
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_GROUP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') setCollapsedGroups(parsed);
      }
    } catch { /* ignore */ }
  }, []);
  // Persist on change
  useEffect(() => {
    try { localStorage.setItem(LS_GROUP_KEY, JSON.stringify(collapsedGroups)); } catch { /* ignore */ }
  }, [collapsedGroups]);
  const toggleGroup = (g: string) => setCollapsedGroups(c => ({ ...c, [g]: !c[g] }));

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Tentativa suave de endpoints agregados (fallback silencioso se não existirem)
  const loadMetrics = useCallback(async (): Promise<boolean> => {
    // Estratégia: chamadas independentes para manter tempo de resposta rápido
    const upd = (key: string, partial: Partial<Metric>) => setMetrics(m => m.map(mm => mm.key===key? { ...mm, ...partial, loading:false }: mm));
    try {
      // Usuários
      try {
        const r = await authenticatedFetch(`${API.ADMIN_USERS}?page=1&pageSize=1`);
        if (r.ok) {
          const data = await r.json();
          if (typeof data.total === 'number') upd('users', { value: data.total }); else upd('users', { value: data.results?.length || 0 });
        } else upd('users', { value: 0 });
      } catch { upd('users', { value: 0 }); }
      // Consultas futuras
      try {
        const from = new Date().toISOString();
        const r = await authenticatedFetch(`${API.ADMIN_CONSULTATIONS}?from=${encodeURIComponent(from)}&page=1&pageSize=1&status=scheduled`);
        if (r.ok) {
          const data = await r.json();
          upd('consultsUpcoming', { value: data.total ?? data.results?.length ?? 0 });
        } else upd('consultsUpcoming', { value: 0 });
      } catch { upd('consultsUpcoming', { value: 0 }); }
      // Posts publicados
      try {
        const r = await authenticatedFetch(`${API.BLOG_POSTS}?page=1&limit=1`);
        if (r.ok) {
          const data = await r.json();
          upd('posts', { value: data.total ?? data.results?.length ?? 0 });
        } else upd('posts', { value: 0 });
      } catch { upd('posts', { value: 0 }); }
      return true;
    } catch {/* ignore root */ return false; }
  }, [authenticatedFetch]);

  const initialLoadToastSent = useRef(false);
  useEffect(()=> {
    void (async () => {
      const ok = await loadMetrics();
      if (!ok && !initialLoadToastSent.current) {
  push({ type: 'error', message: t('admin.layout.metrics.loadError') });
        initialLoadToastSent.current = true;
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadMetrics]);

  // Command palette: atalhos de teclado
  useEffect(()=> {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); setCommandOpen(o=> !o); }
      if (e.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus trap for command palette
  useEffect(() => {
    if (commandOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      // Wait next tick for elements to render
      setTimeout(() => {
        const firstInput = commandRef.current?.querySelector('input,button,[tabindex]') as HTMLElement | null;
        firstInput?.focus();
      }, 0);
    } else if (previouslyFocused.current) {
      previouslyFocused.current.focus();
    }
  }, [commandOpen]);
  useEffect(() => {
    if (!commandOpen) return;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = commandRef.current?.querySelectorAll<HTMLElement>('input,button,[role="option"], [tabindex]:not([tabindex="-1"])');
      if (!focusable || focusable.length === 0) return;
      const list = Array.from(focusable).filter(el => !el.hasAttribute('disabled'));
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', trap, true);
    return () => window.removeEventListener('keydown', trap, true);
  }, [commandOpen]);

  const allCommands = navItems.map(n => ({ type:'nav', path: n.path, label: n.label }))
    .concat([
      { type:'action', path:'#reloadMetrics', label: t('admin.layout.reloadMetrics') },
      { type:'action', path:'#logout', label: t('admin.layout.logout') }
    ] as const);

  const filteredCommands = allCommands.filter(c => !commandQuery || c.label.toLowerCase().includes(commandQuery.toLowerCase()));

  const runCommand = (cmd: typeof filteredCommands[number]) => {
    if (cmd.type==='nav') { navigate(cmd.path); setCommandOpen(false); return; }
    if (cmd.path==='#logout') { logout(); setCommandOpen(false); return; }
    if (cmd.path==='#reloadMetrics') {
      setMetrics(m=> m.map(mm=> ({...mm, loading:true})));
      void (async () => {
        const ok = await loadMetrics();
  push({ type: ok ? 'success' : 'error', message: ok ? t('admin.layout.metrics.reloaded') : t('admin.layout.metrics.reloadError') });
      })();
      setCommandOpen(false);
    }
  };
  const [commandIndex, setCommandIndex] = useState(0);
  useEffect(()=> { setCommandIndex(0); }, [commandQuery, commandOpen]);
  useEffect(()=> {
    if(!commandOpen) return;
    const keyHandler = (e: KeyboardEvent) => {
      if(!filteredCommands.length) return;
      if(e.key === 'ArrowDown'){ e.preventDefault(); setCommandIndex(i=> (i+1) % filteredCommands.length); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); setCommandIndex(i=> (i-1+filteredCommands.length)%filteredCommands.length); }
      else if(e.key === 'Enter'){ e.preventDefault(); runCommand(filteredCommands[commandIndex]); }
    };
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [commandOpen, filteredCommands, commandIndex]);

  // Filtrar navegação por role
  const filteredNav = useMemo(()=> navItems.filter(n => !n.requiresRole || n.requiresRole === user?.role), [user]);
  // Agrupar por group
  const grouped = useMemo(()=> {
    const groups: Record<string, NavItem[]> = {};
    filteredNav.forEach(item => { const g = item.groupId || '_ungrouped'; (groups[g] ||= []).push(item); });
    return groups;
  }, [filteredNav]);

  // Breadcrumb mapping
  const breadcrumb = useMemo(()=> {
    const p = location.pathname.replace(/\/$/,'');
    if (p === '/admin') return [t('admin.breadcrumb.admin'), t('admin.breadcrumb.dashboard')];
    const parts = p.split('/').filter(Boolean).slice(1);
    const mapLabel = (seg: string) => {
      switch(seg){
        case 'usuarios': return t('admin.nav.users');
        case 'consultas': return t('admin.nav.consultations');
        case 'billing': return t('admin.nav.billing');
        case 'relatorios': return t('admin.nav.reports');
        case 'blog': return t('admin.nav.posts');
        case 'new': return t('admin.nav.postNew');
        case 'edit': return t('common.edit');
        case 'audit': return t('admin.nav.audit');
        default: return seg.match(/^[a-f0-9-]{6,}$/)? 'ID' : seg;
      }
    };
    return [t('admin.breadcrumb.admin')].concat(parts.map(mapLabel));
  }, [location.pathname, t]);

  return (
    <div className="min-h-screen bg-gray-100 flex text-sm">
      <SEO title={t('admin.layout.seo.title')} description={t('admin.layout.seo.desc')} />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-56 bg-white border-r shadow-sm flex flex-col transform transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        <div className="h-14 flex items-center justify-between px-4 border-b font-semibold tracking-wide text-green-700">
          <Link to="/" className="hover:opacity-80">AvanteNutri</Link>
          {/* Mobile close button */}
          <button 
            className="md:hidden p-1 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {Object.entries(grouped).map(([groupName, items]) => {
            const isGroup = groupName !== '_ungrouped';
            const collapsed = !!collapsedGroups[groupName];
            const displayGroupName = groupName === 'content' ? t('admin.nav.group.content') : groupName;
            return (
              <div key={groupName} className="mb-4 last:mb-0">
                {isGroup && (
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupName)}
                    className="w-full flex items-center justify-between px-4 pb-1 text-[10px] uppercase tracking-wide text-gray-400 hover:text-gray-600"
                    aria-expanded={!collapsed}
                    aria-controls={`group-${groupName}`}
                  >
                    <span>{displayGroupName}</span>
                    <span className="transition-transform text-gray-300" style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▶</span>
                  </button>
                )}
                <ul id={`group-${groupName}`} className={`space-y-1 ${collapsed ? 'hidden' : ''}`}>                
                  {items.map(item => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) => `flex items-center gap-2 px-4 py-2 rounded-r-full border-l-4 text-gray-700 hover:bg-green-50 hover:text-green-700 transition group ${isActive ? 'bg-green-100 border-green-600 text-green-800 font-medium' : 'border-transparent'}`}
                      >
                        <span className="text-gray-400 group-hover:text-green-600">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-2">
          {user && <div className="text-xs text-gray-600 leading-tight">
            <div className="font-medium text-gray-800 truncate" title={user.full_name || user.email}>{user.full_name || user.email}</div>
            <div className="uppercase tracking-wide text-[10px] text-gray-500">{user.role}</div>
          </div>}
          <Button variant="secondary" className="w-full text-xs" onClick={logout}>{t('common.logout')}</Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        {/* Top bar */}
        <header className="h-14 bg-white/95 backdrop-blur border-b flex items-center justify-between px-4 gap-6 sticky top-0 z-10">
          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-col leading-tight min-w-0 flex-1" aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-[11px] text-gray-500">
              {breadcrumb.map((b,i) => (
                <li key={i} className="flex items-center gap-1">
                  {i>0 && <span className="text-gray-300">/</span>}
                  <span className={`${i===breadcrumb.length-1? 'text-gray-700 font-medium' : ''} truncate`}>{b}</span>
                </li>
              ))}
            </ol>
            <div className="hidden lg:flex gap-4 mt-1">
              {metrics.map(m => (
                <div key={m.key} className="flex flex-col min-w-[90px]">
                  <span className="text-[10px] uppercase tracking-wide text-gray-400">{m.label}</span>
                  {m.loading ? <Skeleton className="h-3 w-8 mt-1" /> : <span className="font-semibold text-gray-700 text-sm">{m.value}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=> setCommandOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs text-gray-600 hover:border-green-500 hover:text-green-700 transition" aria-haspopup="dialog" aria-expanded={commandOpen}>
              <span className="hidden lg:inline">{t('admin.layout.searchGo')}</span>
              <kbd className="text-[10px] px-1 py-0.5 bg-gray-100 rounded border">Ctrl+K</kbd>
            </button>
            <Link to="/dashboard" className="text-xs text-gray-500 hover:text-green-700 hidden sm:inline">{t('admin.layout.backToApp')}</Link>
          </div>
        </header>
        <main className="p-3 md:p-4 lg:p-6 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Command Palette Modal */}
      {commandOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center pt-24 bg-black/30" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e)=> { if(e.target === e.currentTarget) setCommandOpen(false); }}>
          <div ref={commandRef} className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto border animate-fade-in overflow-hidden outline-none" role="listbox" aria-activedescendant={filteredCommands[commandIndex]?.path} tabIndex={-1}>
            <div className="border-b px-3 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input autoFocus value={commandQuery} onChange={e=> setCommandQuery(e.target.value)} placeholder={t('admin.layout.palette.placeholder')} className="flex-1 outline-none text-sm" aria-label={t('admin.layout.palette.searchAria')} />
              <button onClick={()=> setCommandOpen(false)} className="text-[10px] text-gray-500 hover:text-gray-700">ESC</button>
            </div>
            <ul className="max-h-80 overflow-y-auto text-sm">
              {filteredCommands.length === 0 && <li className="px-4 py-6 text-center text-xs text-gray-500">{t('admin.layout.palette.noResults')}</li>}
              {filteredCommands.map((c, i) => (
                <li key={c.path} id={c.path} role="option" aria-selected={i===commandIndex}>
                  <button onClick={()=> runCommand(c)} className={`w-full flex items-center justify-between text-left px-4 py-2 hover:bg-green-50 focus:bg-green-50 outline-none ${i===commandIndex? 'bg-green-50' : ''}`}>
                    <span>{c.label}</span>
                    {c.type==='nav' && <span className="text-[10px] text-gray-400">{c.path}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <div aria-live="polite" className="sr-only">{filteredCommands.length} {t('admin.layout.palette.results')}</div>
            <div className="border-t p-2 flex justify-between text-[10px] text-gray-500 bg-gray-50">
              <span>{t('admin.layout.palette.help')}</span>
              <button onClick={()=> { setCommandOpen(false); setCommandQuery(''); }} className="hover:text-gray-700">{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
