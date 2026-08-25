"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Search, ShoppingCart, User, LogOut, ShieldCheck, X, Bell, Clock, ShieldAlert, CheckCircle2, XCircle, Menu, ChevronDown, ChevronRight, Package, Store } from 'lucide-react';

const allProductsCategory = { _id: 'all', name: 'All Products', slug: 'All' };
const CATEGORY_HIERARCHY: Record<string, string[]> = {
  'Vegetables': ['Exotic Vegetables', 'Leafy Greens', 'Root Vegetables'],
};
const SUBCATEGORIES_SET = new Set(['Exotic Vegetables', 'Leafy Greens', 'Root Vegetables']);
const alwaysVisibleCategorySlugs = new Set(['dairy', 'herbs', 'organic-daals', 'vegetables', 'fruits', 'seeds',]);

// Dummy Data
const dummyProducts = [
  { _id: '1', name: 'Organic Tomatoes', category: 'Vegetables', categorySlug: 'vegetables', image: 'https://images.unsplash.com/photo-1582284540020-8acaf0195b7b?w=400' },
  { _id: '2', name: 'Fresh Spinach', category: 'Greens', categorySlug: 'greens', image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400' },
];
const dummyCategories = [
  { _id: 'c1', name: 'Dairy', slug: 'dairy', isActive: true },
  { _id: 'c2', name: 'Fruits', slug: 'fruits', isActive: true },
  { _id: 'c3', name: 'Herbs', slug: 'herbs', isActive: true },
  { _id: 'c4', name: 'Organic Daals', slug: 'organic-daals', isActive: true },
  { _id: 'c5', name: 'Seeds', slug: 'seeds', isActive: true },
  { _id: 'c6', name: 'Vegetables', slug: 'vegetables', isActive: true },
];
const dummyNotifications = [
  { _id: 'n1', title: 'Order Shipped', message: 'Your order #1234 is on the way!', type: 'approved', isRead: false },
  { _id: 'n2', title: 'New Product', message: 'Fresh Organic Mangoes are now available!', type: 'new_subscription', isRead: true }
];

export default function Navbar() {
  const { data: session, signOut } = useAuth();
  const { cart } = useCart();
  const cartCount = cart?.length || 0;
  const router = useRouter();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProductsMenu, setShowProductsMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [navCategories, setNavCategories] = useState([allProductsCategory]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const activeRole = session?.user?.role || 'guest';
  const isApprovedVendor = activeRole === 'vendor' && session?.user?.vendorStatus === 'approved';
  const accountHref = activeRole === 'admin'
    ? '/admin'
    : isApprovedVendor
      ? '/vendor/dashboard'
      : '/profile';
  const accountLabel = activeRole === 'admin'
    ? 'Admin Panel'
    : isApprovedVendor
      ? 'Vendor Dashboard'
      : 'My Profile';
  const showCart = !session || activeRole === 'user' || activeRole === 'admin'; // added admin so we see it in dummy

  const productCategoryHref = (catId: string) =>
    catId === 'All' ? '/products' : `/products?category=${encodeURIComponent(catId)}`;

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const matchingProducts = useMemo(() => {
    if (!normalizedSearchTerm) return [];
    return searchProducts
      .filter((product) =>
        [product.name, product.category, product.categorySlug, product.description].some((value) =>
          value?.toLowerCase().includes(normalizedSearchTerm),
        ),
      )
      .slice(0, 4);
  }, [normalizedSearchTerm, searchProducts]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  useEffect(() => {
    const handleClose = () => {
      setShowNotifications(false);
      setShowProductsMenu(false);
      setSearchOpen(false);
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  const toggleDropdown = (e: any) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowProductsMenu(false);
  };

  const toggleProductsMenu = (e: any) => {
    e.stopPropagation();
    setShowProductsMenu((open) => !open);
    setShowNotifications(false);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = (e: any) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = (e: any) => {
    e.stopPropagation();
    setNotifications([]);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSearchTerm(new URLSearchParams(window.location.search).get('q') || '');
    setActiveCategory(new URLSearchParams(window.location.search).get('category') || 'All');
    setMobileMenuOpen(false);
    setShowProductsMenu(false);
  }, [pathname]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?limit=250', { cache: 'no-store' }),
          fetch('/api/categories?limit=50', { cache: 'no-store' }),
        ]);

        const productsJson = await productsRes.json();
        const categoriesJson = await categoriesRes.json();

        const productsArray = Array.isArray(productsJson)
          ? productsJson
          : productsJson.data || [];
        const categoriesArray = Array.isArray(categoriesJson)
          ? categoriesJson
          : categoriesJson.data || [];

        setSearchProducts(productsArray);

        const activeCats = categoriesArray.filter(
          (c: any) => c.isActive !== false && c.is_active !== '0'
        );
        // Exclude specific subcategories from the top level
        const mainCats = activeCats.filter((c: any) => !SUBCATEGORIES_SET.has(c.name));
        mainCats.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

        setNavCategories([
          allProductsCategory,
          ...mainCats.map((cat: any) => ({
            _id: cat._id,
            name: cat.name,
            slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
          })),
        ]);
      } catch (err) {
        console.error('Failed to fetch navbar data:', err);
        setSearchProducts(dummyProducts);
        setNavCategories([
          allProductsCategory,
          ...dummyCategories.map((cat) => ({
            _id: cat._id,
            name: cat.name,
            slug: cat.slug,
          })),
        ]);
      }
    };

    fetchData();
    setNotifications(dummyNotifications);
  }, []);

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    setSearchOpen(Boolean(value.trim()));
    setShowProductsMenu(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchOpen(false);
  };

  const submitSearch = () => {
    const query = searchTerm.trim();
    if (!query) {
      setSearchOpen(false);
      router.push('/products');
      return;
    }
    setSearchOpen(false);
    router.push(`/products?q=${encodeURIComponent(query)}`);
  };

  const openProduct = (productId: string) => {
    setSearchOpen(false);
    router.push(`/product/${productId}`);
  };

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/vendor/') || pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto max-w-[90rem] w-full px-4 sm:px-6 lg:px-8">

        {/* Main layout container */}
        <div className="flex flex-col py-3 lg:py-4">

          {/* TOP ROW: Logo, Search, and Action Controls */}
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="group flex items-center gap-2">
              <Image src="/logo.png" alt="Organic Vatika" width={55} height={55} priority className="object-contain" />
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-text-brand transition-colors duration-200">
                Veg<span className="text-[#6b4308]  transition-colors duration-200">King</span>
              </span>
            </Link>

            {/* Search Bar (desktop) */}
            <div className="relative hidden flex-1 max-w-xl mx-2 lg:block" onClick={(e) => e.stopPropagation()}>
              <div className="group relative flex h-10 items-center gap-2.5 border border-gray-200 bg-gray-50/50 pl-3 text-gray-500 transition-all duration-300 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="h-4 w-4 shrink-0 text-gray-400 group-focus-within:text-primary" strokeWidth={2.2} />
                <input
                  type="text"
                  inputMode="search"
                  value={searchTerm}
                  onChange={(event) => updateSearch(event.target.value)}
                  onFocus={() => setSearchOpen(Boolean(searchTerm.trim()))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitSearch();
                    }
                  }}
                  placeholder="Search fresh vegetables..."
                  aria-label="Search vegetables by name"
                  className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-gray-800 outline-none placeholder:text-gray-400/75"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear vegetable search"
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={submitSearch}
                  className="h-full shrink-0 bg-primary px-5 text-xs font-extrabold text-white transition hover:bg-primary-hover"
                >
                  Search
                </button>
              </div>

              {searchOpen && searchTerm.trim() && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden border border-gray-100 bg-white shadow-2xl">
                  <div className="border-b border-gray-100 bg-background-secondary px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-gray-500">
                    Matching Products
                  </div>
                  {matchingProducts.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {matchingProducts.map((product) => (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() => openProduct(product._id)}
                          className="flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-green-50"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                            <Image src={product.image} alt={product.name} fill sizes="48px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-gray-950">{product.name}</p>
                            <p className="mt-0.5 truncate text-xs font-medium text-gray-500">{product.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-5 py-4 text-sm font-semibold text-gray-500">
                      No matching products found.
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={submitSearch}
                    className="w-full border-t border-gray-100 px-5 py-4 text-center text-sm font-extrabold text-primary transition hover:bg-green-50"
                  >
                    See all results for &quot;{searchTerm.trim()}&quot;
                  </button>
                </div>
              )}
            </div>

            {/* Desktop and Tablet Action Cluster */}
            <div className="flex items-center gap-2">

              {/* Notification Bell (if logged in, desktop only) */}
              {session && (
                <div className="relative inline-block shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={toggleDropdown}
                    className={`relative inline-flex h-10 w-10 items-center justify-center border shadow-sm transition-all duration-300 ${showNotifications
                      ? 'border-green-300 bg-green-50 text-primary'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-green-100 hover:bg-green-50 hover:text-primary'
                      }`}
                    aria-label="View notifications"
                  >
                    <Bell className="h-4 w-4" strokeWidth={2.2} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-red-500 px-1 text-[8px] font-bold leading-none text-white shadow-sm ring-2 ring-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute -right-24 sm:right-0 mt-3 w-80 sm:w-96 border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-fadeIn">
                      <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between bg-gray-50">
                        <div className="font-extrabold text-gray-900 text-xs flex items-center gap-1">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="bg-red-100 text-red-700 text-[9px] font-bold px-2 py-0.5">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {notifications.length > 0 && (
                            <>
                              <button
                                onClick={markAllRead}
                                className="text-[9px] text-primary hover:text-primary-hover font-bold uppercase tracking-wider"
                              >
                                Mark Read
                              </button>
                              <span className="text-gray-300 text-[9px]">|</span>
                              <button
                                onClick={clearAll}
                                className="text-[9px] text-gray-400 hover:text-gray-600 font-bold uppercase tracking-wider"
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-gray-400 space-y-1.5">
                            <Bell className="w-6 h-6 text-gray-200 mx-auto" />
                            <p className="text-xs font-bold text-gray-800">All caught up!</p>
                            <p className="text-[10px]">No notifications right now.</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            let Icon = Bell;
                            let iconColor = 'text-gray-500 bg-gray-50';

                            switch (notif.type) {
                              case 'approved':
                                Icon = CheckCircle2;
                                iconColor = 'text-primary bg-green-50 border border-green-100/50';
                                break;
                              case 'rejected':
                              case 'cancelled':
                                Icon = XCircle;
                                iconColor = 'text-red-600 bg-red-50 border border-red-100/50';
                                break;
                              case 'paused':
                                Icon = Clock;
                                iconColor = 'text-amber-500 bg-amber-50 border border-amber-100/50';
                                break;
                              case 'resumed':
                                Icon = CheckCircle2;
                                iconColor = 'text-blue-500 bg-blue-50 border border-blue-100/50';
                                break;
                              case 'recurring_created':
                                Icon = Package;
                                iconColor = 'text-indigo-600 bg-indigo-50 border border-indigo-100/50';
                                break;
                              case 'delivery_reminder':
                              case 'renewal_reminder':
                                Icon = Clock;
                                iconColor = 'text-orange-500 bg-orange-50 border border-orange-100/50';
                                break;
                              case 'pending_approval':
                              case 'new_subscription':
                                Icon = Bell;
                                iconColor = 'text-amber-600 bg-amber-50 border border-amber-100/50';
                                break;
                              case 'recurring_failed':
                                Icon = ShieldAlert;
                                iconColor = 'text-red-700 bg-red-50 border border-red-100/50';
                                break;
                            }

                            return (
                              <div
                                key={notif._id}
                                onClick={() => markAsRead(notif._id)}
                                className={`p-3.5 hover:bg-gray-50/80 transition-all cursor-pointer flex gap-2.5 relative ${!notif.isRead ? 'bg-blue-50/10' : ''
                                  }`}
                              >
                                <div className={`w-8 h-8 flex items-center justify-center shrink-0 shadow-sm ${iconColor}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5 pr-2 flex-1">
                                  <div className={`text-xs font-bold text-gray-900 leading-tight ${!notif.isRead ? 'font-black' : ''}`}>
                                    {notif.title}
                                  </div>
                                  <div className="text-[10px] text-gray-500 leading-normal font-medium">
                                    {notif.message}
                                  </div>
                                </div>
                                {!notif.isRead && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Login / Sign Up or Sign Out Buttons */}
              <div className="hidden lg:flex items-center gap-2">
                {session ? (
                  <div className="relative group z-50">
                    <button className="flex items-center gap-1.5 text-gray-700 bg-gray-50/80 px-3 py-2 border border-gray-100 hover:bg-white cursor-pointer">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold max-w-[110px] truncate">{session.user.name}</span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-0 w-52 bg-white border border-gray-100 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-1.5 rounded-xl">
                      {activeRole === 'admin' && (
                        <>
                          <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-100 text-[10px] font-black text-amber-800 uppercase tracking-wider">
                            Logged in as Admin
                          </div>
                          <Link
                            href="/admin"
                            className="block px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-green-50 hover:text-primary transition"
                          >
                            ⚙️ Admin Dashboard
                          </Link>
                          <Link
                            href="/profile/orders"
                            className="block px-4 py-2 text-xs font-medium text-gray-600 hover:bg-green-50 hover:text-primary transition"
                          >
                            📦 View System Orders
                          </Link>
                        </>
                      )}

                      {activeRole === 'vendor' && (
                        <>
                          <div className="px-4 py-2 bg-green-50/70 border-b border-green-100 text-[10px] font-black text-green-800 uppercase tracking-wider">
                            Merchant Account
                          </div>
                          <Link
                            href="/vendor/dashboard"
                            className="block px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-green-50 hover:text-primary transition"
                          >
                            🏪 Vendor Dashboard
                          </Link>
                        </>
                      )}

                      {activeRole === 'user' && (
                        <>
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-600 uppercase tracking-wider">
                            Customer Account
                          </div>
                          <Link
                            href="/profile"
                            className="block px-4 py-2.5 text-xs font-bold text-gray-800 hover:bg-green-50 hover:text-primary transition"
                          >
                            👤 My Profile
                          </Link>
                          <Link
                            href="/profile/orders"
                            className="block px-4 py-2 text-xs font-bold text-gray-800 hover:bg-green-50 hover:text-primary transition"
                          >
                            📦 My Orders
                          </Link>
                        </>
                      )}

                      <div className="h-px bg-gray-100 my-1" />

                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {activeRole === 'admin' ? 'Logout (Switch User)' : 'Logout'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-flex h-10 items-center justify-center border border-primary bg-white px-4 text-xs font-bold text-primary transition-all duration-300 hover:bg-green-50"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </div>

              {/* Solid Green Cart Button */}
              {showCart && (
                <Link
                  id="navbar-cart-button"
                  href="/cart"
                  aria-label={`Shopping cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
                  className="relative inline-flex h-10 w-10 items-center justify-center bg-primary text-white shadow-md shadow-primary/20 transition-all duration-300 hover:bg-primary-hover hover:scale-[1.03] shrink-0"
                >
                  <ShoppingCart className="h-4.5 w-4.5" strokeWidth={2.3} />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex h-10 w-10 items-center justify-center border border-gray-100 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:bg-gray-50 lg:hidden shrink-0"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
              </button>

            </div>
          </div>

          {/* Mobile/tablet search lives inside the sidebar drawer */}
          <div className="hidden">
            <div className="group relative flex h-10 items-center gap-2 border border-gray-200 bg-gray-50/50 px-3 text-gray-500 transition-all duration-300 focus-within:border-primary focus-within:bg-white">
              <Search className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2.2} />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search fresh vegetables..."
                className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-gray-800 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-gray-400"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* TOP & BOTTOM ROW DIVIDER */}
          <div className="hidden lg:block w-full border-t border-gray-100/80 my-3"></div>

          {/* BOTTOM ROW: Navigation Links */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/"
              className={`px-4 py-2 text-xs font-extrabold transition-all duration-300 ${pathname === '/'
                ? 'bg-primary text-white shadow-md shadow-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
            >
              Home
            </Link>

            <Link
              href="/about"
              className={`px-4 py-2 text-xs font-extrabold transition-all duration-300 ${pathname === '/about'
                ? 'bg-primary text-white shadow-md shadow-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
            >
              About
            </Link>

            <Link
              href="/vendors"
              className={`px-4 py-2 text-xs font-extrabold transition-all duration-300 ${pathname === '/vendors'
                ? 'bg-primary text-white shadow-md shadow-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
            >
              Sellers
            </Link>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={toggleProductsMenu}
                aria-haspopup="menu"
                aria-expanded={showProductsMenu}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold transition-all duration-300 ${pathname?.startsWith('/products')
                  ? 'bg-primary text-white shadow-md shadow-primary/10'
                  : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                  }`}
              >
                Products
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showProductsMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProductsMenu && (
                <div className="absolute left-0 top-full z-50 mt-0 w-56 border-l-2 border-primary bg-white shadow-xl ring-1 ring-black/5 animate-fadeIn">
                  <div className="relative py-1">
                    {navCategories.map((cat) => {
                      const subItems = CATEGORY_HIERARCHY[cat.name] || [];
                      const hasSubs = subItems.length > 0;
                      return (
                        <div
                          key={cat._id || cat.slug}
                          onMouseEnter={() => setHoveredCategory(cat.name)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className="relative group"
                        >
                          <Link
                            href={productCategoryHref(cat.slug)}
                            onClick={() => {
                              setActiveCategory(cat.slug);
                              setShowProductsMenu(false);
                            }}
                            className={`flex items-center justify-between px-8 py-3.5 text-sm font-medium transition-all duration-200 ${activeCategory === cat.slug && pathname?.startsWith('/products')
                              ? 'bg-green-50 text-primary font-bold'
                              : 'text-slate-1200 hover:bg-green-50 hover:text-primary'
                              }`}
                          >
                            <span>{cat.name}</span>
                            {hasSubs && (
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors duration-200" />
                            )}
                          </Link>

                          {/* Subcategory flyout */}
                          {hasSubs && hoveredCategory === cat.name && (
                            <div className="absolute left-full top-0 z-50 w-56 border-l border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 animate-fadeIn">
                              <div className="py-1">
                                {subItems.map((subName) => {
                                  const subSlug = subName.toLowerCase().replace(/\s+/g, '-');
                                  return (
                                    <Link
                                      key={subName}
                                      href={productCategoryHref(subSlug)}
                                      onClick={() => {
                                        setActiveCategory(subSlug);
                                        setShowProductsMenu(false);
                                      }}
                                      className={`block px-8 py-3 text-sm font-medium transition-all duration-200 text-slate-1200 hover:bg-green-50 hover:text-primary`}
                                    >
                                      {subName}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>



            <Link
              href={isApprovedVendor ? '/vendor/dashboard' : '/partner'}
              className={`px-4 py-2 text-xs font-extrabold transition-all duration-300 flex items-center gap-1.5 ${pathname === '/partner' || (isApprovedVendor && pathname?.startsWith('/vendor'))
                ? 'bg-primary text-white shadow-md shadow-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
            >
              <Store className="w-3.5 h-3.5" strokeWidth={2.2} />
              {isApprovedVendor ? 'Vendor Dashboard' : 'Grow With Us'}
            </Link>

            <Link
              href="/contact"
              className={`px-4 py-2 text-xs font-extrabold transition-all duration-300 ${pathname === '/contact'
                ? 'bg-primary text-white shadow-md shadow-primary/10'
                : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
            >
              Contact
            </Link>
          </div>

        </div>

        {/* Mobile and tablet Navigation Drawer */}
        {mobileMenuOpen && typeof document !== 'undefined' && createPortal((
          <div className="fixed inset-0 z-[70] bg-black/55 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <aside
              className="relative ml-auto flex h-full w-[min(82vw,24rem)] flex-col overflow-y-auto bg-white shadow-2xl animate-slideInRight"
              onClick={(e) => e.stopPropagation()}
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-7 py-7">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-700 text-sm font-black text-white">
                    {session?.user?.name?.charAt(0) || 'O'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-gray-950">
                      {session?.user?.name || 'Organic Vatika'}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-gray-500">
                      {session ? session.user.role || 'Buyer' : 'Guest'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-gray-900 transition hover:bg-gray-50"
                  aria-label="Close navigation menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 px-7 py-7">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Quick Links</p>
                <div className="mt-5 flex flex-col gap-1">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-1 py-3 text-base font-bold transition ${pathname === '/' ? 'text-primary' : 'text-gray-950 hover:text-primary'
                      }`}
                  >
                    <Menu className="h-5 w-5 text-gray-900" />
                    Home
                  </Link>

                  <Link
                    href={searchTerm.trim() ? `/products?q=${encodeURIComponent(searchTerm.trim())}` : '/products'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-1 py-3 text-base font-bold text-gray-950 transition hover:text-primary"
                  >
                    <Search className="h-5 w-5 text-gray-900" />
                    Search Products
                  </Link>

                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-1 py-3 text-base font-bold transition ${pathname === '/about' ? 'text-primary' : 'text-gray-950 hover:text-primary'
                      }`}
                  >
                    <Menu className="h-5 w-5 text-gray-900" />
                    About VegKing
                  </Link>

                  <Link
                    href="/vendors"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-1 py-3 text-base font-bold transition ${pathname === '/vendors' ? 'text-primary' : 'text-gray-950 hover:text-primary'
                      }`}
                  >
                    <Store className="h-5 w-5 text-gray-900" />
                    Our Sellers
                  </Link>
                </div>

                <div className="mt-10">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Account</p>
                  <div className="mt-5 flex flex-col gap-1">
                    {session ? (
                      <Link
                        href={accountHref}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-1 py-3 text-base font-bold text-gray-950 transition hover:text-primary"
                      >
                        <User className="h-5 w-5 text-gray-900" />
                        {accountLabel}
                      </Link>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-4 px-1 py-3 text-base font-bold text-gray-950 transition hover:text-primary"
                      >
                        <User className="h-5 w-5 text-gray-900" />
                        Login / Sign Up
                      </Link>
                    )}
                    <Link
                      href={isApprovedVendor ? '/vendor/dashboard' : '/partner'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-1 py-3 text-base font-bold text-gray-950 transition hover:text-primary"
                    >
                      <Store className="h-5 w-5 text-gray-900" />
                      {isApprovedVendor ? 'Vendor Dashboard' : 'Grow with us'}
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ), document.body)}

      </div>
    </nav>
  );
}
