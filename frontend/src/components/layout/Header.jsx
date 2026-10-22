import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useContent } from '../../store/hooks.js'
import { safePath } from '../../lib/links.js'
import { useWishlist } from '../../context/WishlistContext.jsx'
import Drawer from '../ui/Drawer.jsx'
import SearchDialog from './SearchDialog.jsx'
import Logo from './Logo.jsx'

export default function Header() {
  const { count } = useCart()
  const wishlist = useWishlist()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { navigation } = useContent()
  const links = navigation.links.filter((l) => l.enabled && l.label.trim()).map((l) => ({ ...l, to: safePath(l.to) }))
  const buildSet = navigation.showBuildSet && navigation.buildSetLabel.trim()

  // Close the mobile menu when the route changes.
  const [lastPath, setLastPath] = useState(location.pathname)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header__inner">
        <button type="button" className="icon-btn header__menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
          <Menu size={22} />
        </button>

        <Logo className="logo--header" priority />

        <nav className="header__nav" aria-label="Main">
          <ul role="list">
            {links.map((l) => (
              <li key={l.id}>
                <NavLink to={l.to} end={l.to === '/'} className="header__link">
                  {l.label}
                </NavLink>
              </li>
            ))}
            {buildSet && (
              <li>
                <NavLink to="/bedding-sets/builder" className="header__link header__link--accent">
                  {navigation.buildSetLabel}
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className="header__actions">
          <button type="button" className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
            <Search size={19} />
          </button>
          <Link to="/account" className="icon-btn header__hide-sm" aria-label="Account">
            <User size={19} />
          </Link>
          <Link to="/wishlist" className="icon-btn" aria-label={`Wishlist, ${wishlist.count} item${wishlist.count === 1 ? '' : 's'}`}>
            <Heart size={19} />
            {wishlist.count > 0 && <span className="icon-btn__count">{wishlist.count}</span>}
          </Link>
          <Link to="/cart" className="icon-btn" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
            <ShoppingBag size={19} />
            {count > 0 && <span className="icon-btn__count icon-btn__count--green">{count}</span>}
          </Link>
        </div>
      </div>

      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        side="left"
        className="mobile-menu"
        brand={<Logo className="logo--menu" onClick={() => setMenuOpen(false)} />}
      >
        <nav aria-label="Mobile">
          <ul role="list" className="mobile-menu__list">
            {links.map((l) => (
              <li key={l.id}>
                <NavLink to={l.to} end={l.to === '/'} className="mobile-menu__link">
                  {l.label}
                </NavLink>
              </li>
            ))}
            {buildSet && (
              <li>
                <NavLink to="/bedding-sets/builder" className="mobile-menu__link mobile-menu__link--accent">
                  {navigation.buildSetLabel}
                </NavLink>
              </li>
            )}
          </ul>
          <ul role="list" className="mobile-menu__secondary">
            <li><Link to="/wishlist">Wishlist ({wishlist.count})</Link></li>
            <li><Link to="/cart">Cart ({count})</Link></li>
            <li><Link to="/account">Account</Link></li>
            <li><Link to="/help/contact">Contact</Link></li>
          </ul>
        </nav>
      </Drawer>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
