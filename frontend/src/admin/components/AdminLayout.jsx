import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Boxes,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderOpen,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelsTopLeft,
  ReceiptText,
  Settings,
  TriangleAlert,
} from 'lucide-react'
import Drawer from '../../components/ui/Drawer.jsx'
import { LogoImage } from '../../components/layout/Logo.jsx'
import { PageLoader } from '../../components/ui/EmptyState.jsx'
import { useAdminAuth } from '../auth/AdminAuthContext.jsx'
import { ConfirmProvider } from './ConfirmContext.jsx'
import { UnsavedChangesProvider, useUnsavedChangesGuard } from './UnsavedChangesContext.jsx'
import { useStore } from '../../store/hooks.js'
import { useToast } from '../../context/ToastContext.jsx'
import '../admin.css'

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/collections', label: 'Collections', icon: FolderOpen },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { to: '/admin/build-a-set', label: 'Build a Set', icon: Layers },
  { to: '/admin/content', label: 'Content', icon: PanelsTopLeft },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
  { to: '/admin/activity', label: 'Activity', icon: History },
]

/** Title + breadcrumb trail for the current admin URL. */
function routeMeta(pathname) {
  const parts = pathname.replace(/\/+$/, '').split('/').slice(2) // after /admin
  const section = ADMIN_NAV.find((n) => n.to === `/admin/${parts[0] ?? ''}`.replace(/\/$/, '')) ?? ADMIN_NAV[0]
  const crumbs = [{ label: 'Admin', to: '/admin' }]
  if (!parts.length) return { title: 'Dashboard', crumbs: [...crumbs, { label: 'Dashboard' }] }
  if (parts.length === 1) return { title: section.label, crumbs: [...crumbs, { label: section.label }] }
  const leaf = parts[1] === 'new' ? `New ${section.label.replace(/s$/, '').toLowerCase()}` : `Edit ${section.label.replace(/s$/, '').toLowerCase()}`
  return { title: leaf.charAt(0).toUpperCase() + leaf.slice(1), crumbs: [...crumbs, { label: section.label, to: section.to }, { label: leaf.charAt(0).toUpperCase() + leaf.slice(1) }] }
}

/** Click handler factory: in-app navigation that asks before discarding unsaved edits. */
function useGuardedNavigate(onNavigate) {
  const { confirmLeave } = useUnsavedChangesGuard()
  const navigate = useNavigate()
  const location = useLocation()
  return (to) => async (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (location.pathname === to) {
      onNavigate?.()
      return
    }
    if (await confirmLeave()) {
      navigate(to)
      onNavigate?.()
    }
  }
}

function SideNav({ onNavigate }) {
  const guard = useGuardedNavigate(onNavigate)
  return (
    <nav aria-label="Admin" className="adm-nav">
      <ul role="list">
        {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className="adm-nav__link" onClick={guard(to)}>
              <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function SidebarFooter() {
  return (
    <div className="adm-sidebar__foot">
      <a href="/" target="_blank" rel="noopener noreferrer" className="adm-sidebar__store">
        <ExternalLink size={15} aria-hidden="true" /> View storefront
      </a>
      <p className="adm-sidebar__demo">
        <TriangleAlert size={13} aria-hidden="true" /> Demo mode — changes are saved only in this browser.
      </p>
    </div>
  )
}

function AccountMenu() {
  const { session, signOut } = useAdminAuth()
  const { confirmLeave } = useUnsavedChangesGuard()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const initials = (session?.name ?? 'Admin')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onSignOut = async () => {
    setOpen(false)
    if (!(await confirmLeave())) return
    signOut()
    notify({ tone: 'info', title: 'Signed out', message: 'Your demo session has ended.' })
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="adm-account" ref={ref}>
      <button type="button" className="adm-account__btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="adm-avatar" aria-hidden="true">
          {initials}
        </span>
        <span className="adm-account__name">{session?.name}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="adm-account__menu" role="menu">
          <div className="adm-account__who">
            <strong>{session?.name}</strong>
            <span>{session?.email}</span>
            <span className="adm-account__tag">{session?.remember ? 'Demo session · remembered for 7 days' : 'Demo session · ends with this tab'}</span>
          </div>
          <a role="menuitem" href="/" target="_blank" rel="noopener noreferrer" className="adm-account__item" onClick={() => setOpen(false)}>
            <ExternalLink size={15} aria-hidden="true" /> View storefront
          </a>
          <button role="menuitem" type="button" className="adm-account__item adm-account__item--danger" onClick={onSignOut}>
            <LogOut size={15} aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

function Topbar({ onMenu }) {
  const { pathname } = useLocation()
  const { title, crumbs } = routeMeta(pathname)
  const { lastSave } = useStore()
  const guard = useGuardedNavigate()
  return (
    <header className="adm-topbar">
      <button type="button" className="adm-icon-btn adm-topbar__menu" onClick={onMenu} aria-label="Open admin menu">
        <Menu size={20} />
      </button>
      <div className="adm-topbar__title">
        <nav aria-label="Breadcrumb" className="adm-crumbs">
          <ol role="list">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`}>
                {c.to && i < crumbs.length - 1 ? (
                  <Link to={c.to} onClick={guard(c.to)}>
                    {c.label}
                  </Link>
                ) : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>}
                {i < crumbs.length - 1 && <ChevronRight size={12} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </nav>
        <p className="adm-topbar__page" aria-hidden="true">
          {title}
        </p>
      </div>
      <div className="adm-topbar__right">
        {!lastSave.ok && (
          <span className="adm-status adm-status--bad" role="status">
            <TriangleAlert size={12} aria-hidden="true" /> Not saved to browser storage
          </span>
        )}
        <span className="adm-demo-pill">Demo</span>
        <AccountMenu />
      </div>
    </header>
  )
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const guard = useGuardedNavigate()
  const { pathname } = useLocation()
  const { title } = routeMeta(pathname)
  const { loadIssues } = useStore()

  // Close the mobile menu after navigating.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    document.title = `${title} · Admin | FLONEA`
  }, [title])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="adm">
      <a href="#adm-main" className="skip-link">
        Skip to content
      </a>
      <aside className="adm-sidebar" aria-label="Admin sidebar">
        <Link to="/admin" className="adm-sidebar__brand" aria-label="FLONEA Admin — dashboard" onClick={guard('/admin')}>
          <span className="logo adm-sidebar__logo">
            <LogoImage alt="" priority />
          </span>
          <span className="adm-sidebar__label">Admin</span>
        </Link>
        <SideNav />
        <SidebarFooter />
      </aside>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Admin menu"
        side="left"
        className="adm-mobile-nav"
        brand={
          <span className="logo adm-sidebar__logo">
            <LogoImage alt="FLONEA Admin" />
          </span>
        }
      >
        <SideNav onNavigate={() => setMenuOpen(false)} />
        <SidebarFooter />
      </Drawer>

      <div className="adm-main">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main id="adm-main" className="adm-content" tabIndex={-1}>
          {loadIssues.length > 0 && (
            <div className="adm-note adm-note--warning adm-load-issues" role="status">
              <TriangleAlert size={15} aria-hidden="true" />
              <span>
                <strong>Some saved data couldn’t be used and was replaced with defaults:</strong> {loadIssues.slice(0, 3).join(' ')}
              </span>
            </div>
          )}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

/** Admin chrome: sidebar (drawer on small screens), top bar with breadcrumbs and account menu, page outlet. */
export default function AdminLayout() {
  return (
    <ConfirmProvider>
      <UnsavedChangesProvider>
        <Shell />
      </UnsavedChangesProvider>
    </ConfirmProvider>
  )
}
