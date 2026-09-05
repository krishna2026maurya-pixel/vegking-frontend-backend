'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BarChart3, Loader2, LogOut, Package, PackagePlus, ReceiptText, Store, User, X, Bike, Bell, Settings, ShieldCheck, CheckCircle2, AlertTriangle, Landmark, Search, Mail, ChevronDown, Plus, Heart, Filter, MessageSquare, HelpCircle, Sparkles, Download, Eye, ArrowUpDown, Trash2, Scale, Send, Check, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DataTable, { Column, Action } from '@/app/admin/components/DataTable';

const tabs = [
  { id: 'home', label: 'Market', icon: BarChart3 },
  { id: 'products', label: 'My Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ReceiptText },
  { id: 'negotiations', label: 'Bulk Inquiries', icon: Scale },
  { id: 'customers', label: 'Customers', icon: User },
  { id: 'riders', label: 'My Riders', icon: Bike },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Store Profile', icon: Store },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const getSafeProductImage = (img: any) => {
  if (typeof img !== 'string') return '/images/product-card-default.jpg';
  const trimmed = img.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return '/images/product-card-default.jpg';
};

const ShimmerProductCard = () => (
  <div className="border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl p-3 flex flex-col justify-between animate-pulse">
    <div className="h-28 w-full bg-gray-200 dark:bg-gray-700/80 rounded-xl mb-3" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700/80 rounded-md w-3/4 animate-pulse" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700/80 rounded-md w-1/2 animate-pulse" />
    </div>
    <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-50 dark:border-gray-700">
      <div className="h-4 bg-gray-200 dark:bg-gray-700/80 rounded-md w-1/3 animate-pulse" />
      <div className="h-7 w-7 bg-gray-200 dark:bg-gray-700/80 rounded-lg animate-pulse" />
    </div>
  </div>
);

const ShimmerCategoryCard = () => (
  <div className="border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl p-4 flex flex-col gap-4 items-start animate-pulse">
    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700/80 rounded-xl animate-pulse" />
    <div className="space-y-1.5 w-full">
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700/80 rounded-md w-1/2 animate-pulse" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700/80 rounded-md w-3/4 animate-pulse" />
    </div>
  </div>
);

const ShimmerListRow = () => (
  <div className="p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-between gap-4 animate-pulse">
    <div className="flex items-center gap-4 w-full">
      <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700/80 rounded-lg shrink-0 animate-pulse" />
      <div className="space-y-2 w-full">
        <div className="h-4 bg-gray-200 dark:bg-gray-700/80 rounded-md w-1/3 animate-pulse" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700/80 rounded-md w-1/2 animate-pulse" />
      </div>
    </div>
    <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700/80 rounded-lg shrink-0 animate-pulse" />
  </div>
);


const emptyProduct = {
  name: '',
  price: '',
  discount: '0',
  stock: '50',
  description: '',
  image: '',
  categorySlug: '',
  weightOptions: [] as Array<{ weight: string; price: string }>,
  is_bulk_available: false,
  bulk_min_qty: '5',
  bulk_base_price: '',
  bulk_unit: 'kg',
  bulk_stock: '',
};

export default function VendorDashboardPage() {
  const { data: session, status, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('vendor_theme');
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.documentElement.classList.remove('dark');
      }
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vendor_theme', next ? 'dark' : 'light');
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  };

  const changeTab = useCallback((tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.pushState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'add') {
        setActiveTab('products');
        setShowProductModal(true);
      } else if (tab && tabs.some((t) => t.id === tab)) {
        setActiveTab(tab);
      }
    }
  }, []);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  // Paginated orders for the Orders tab (matching Admin dashboard logic)
  const [paginatedOrders, setPaginatedOrders] = useState<any[]>([]);
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotalPages, setOrderTotalPages] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('');
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [orderStatusModal, setOrderStatusModal] = useState<{ open: boolean; orderId: string | null; current: string; otp: string }>({ open: false, orderId: null, current: 'Order Placed', otp: '' });
  const [assignRiderModal, setAssignRiderModal] = useState<{ open: boolean; orderId: string | null; currentRiderId: string; itemId?: string | null; itemName?: string | null }>({ open: false, orderId: null, currentRiderId: '', itemId: null, itemName: null });
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [riderForm, setRiderForm] = useState({ name: '', email: '', mobile_number: '', password: '', vehicle_type: 'Bike', vehicle_number: '' });
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [editingRiderId, setEditingRiderId] = useState<string | null>(null);
  const [viewingRider, setViewingRider] = useState<any>(null);

  const [settingsForm, setSettingsForm] = useState({
    storeOpen: true,
    minOrderFree: '300',
    handlingCharge: '20',
    bankName: 'HDFC Bank',
    bankAccNo: '501004561234',
    bankIfsc: 'HDFC0000240',
    openTime: '06:00',
    closeTime: '22:00'
  });

  const [matchingGlobalProducts, setMatchingGlobalProducts] = useState<any[]>([]);
  const [searchingGlobal, setSearchingGlobal] = useState(false);

  // Bulk Negotiations State
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [selectedNegotiation, setSelectedNegotiation] = useState<any>(null);
  const [negotiationMessages, setNegotiationMessages] = useState<any[]>([]);
  const [negotiationFilter, setNegotiationFilter] = useState('');
  const [negotiationLoading, setNegotiationLoading] = useState(false);
  const [vendorChatInput, setVendorChatInput] = useState('');
  const [vendorCounterInput, setVendorCounterInput] = useState('');
  const [actionSending, setActionSending] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchNegotiations = useCallback(async () => {
    if (!session?.user?.id) return;
    setNegotiationLoading(true);
    try {
      const res = await fetch(`/api/negotiations?vendor_id=${session.user.id}`);
      const json = await res.json();
      if (json.success) {
        setNegotiations(json.data || []);
      }
    } catch (e) {
      console.error('Failed to load vendor negotiations:', e);
    } finally {
      setNegotiationLoading(false);
    }
  }, [session?.user?.id]);

  const fetchVendorNotifications = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/vendor/notifications?vendor_id=${session.user.id}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
        setUnreadNotifCount(json.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchVendorNotifications();
    const interval = setInterval(() => {
      fetchVendorNotifications();
      fetchNegotiations();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchVendorNotifications, fetchNegotiations]);

  const markNotificationAsRead = async (notifId?: string, markAll = false) => {
    try {
      await fetch('/api/vendor/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId, mark_all: markAll, vendor_id: session?.user?.id }),
      });
      fetchVendorNotifications();
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  };

  const handleNotificationClick = async (item: any) => {
    await markNotificationAsRead(item._id || item.id);
    setShowNotificationDropdown(false);
    if (item.type === 'bulk_inquiry' || item.type === 'bulk_chat' || item.type === 'negotiation' || item.session_id) {
      changeTab('negotiations');
      if (item.session_id) {
        const matching = negotiations.find((n) => n._id === item.session_id);
        if (matching) {
          openNegotiation(matching);
        } else {
          try {
            const res = await fetch(`/api/negotiations/${item.session_id}`);
            const json = await res.json();
            if (json.success && json.data) {
              openNegotiation(json.data.session || json.data);
            }
          } catch {}
        }
      }
    } else if (item.type === 'new_order' || item.type === 'order_status') {
      changeTab('orders');
    } else {
      changeTab('notifications');
    }
  };

  const openNegotiation = async (sessionItem: any) => {
    if (!sessionItem) return;
    const sessionObj = sessionItem.session || sessionItem;
    setSelectedNegotiation(sessionObj);
    try {
      const res = await fetch(`/api/negotiations/${sessionObj._id}`);
      const json = await res.json();
      if (json.success && json.data) {
        if (json.data.session) {
          setSelectedNegotiation(json.data.session);
        }
        setNegotiationMessages(json.data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVendorSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNegotiation?._id || (!vendorChatInput.trim() && !vendorCounterInput)) return;
    setActionSending(true);
    try {
      const proposedPrice = vendorCounterInput ? Number(vendorCounterInput) : null;
      const res = await fetch(`/api/negotiations/${selectedNegotiation._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: session?.user?.id,
          sender_role: 'vendor',
          sender_name: profile?.businessName || session?.user?.name || 'Vendor',
          message: vendorChatInput.trim(),
          proposed_price: proposedPrice,
          proposed_qty: selectedNegotiation.requested_qty,
          offer_type: proposedPrice ? 'COUNTER' : 'CHAT',
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setNegotiationMessages((prev) => [...prev, json.data]);
        setVendorChatInput('');
        setVendorCounterInput('');
        fetchNegotiations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionSending(false);
    }
  };

  const handleVendorAction = async (action: 'ACCEPT' | 'REJECT') => {
    if (!selectedNegotiation?._id) return;
    setActionSending(true);
    try {
      const res = await fetch(`/api/negotiations/${selectedNegotiation._id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          sender_id: session?.user?.id,
          sender_role: 'vendor',
          final_price: selectedNegotiation.current_counter_price,
          final_qty: selectedNegotiation.requested_qty,
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setSelectedNegotiation(json.data);
        openNegotiation(json.data);
        fetchNegotiations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionSending(false);
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const stats = useMemo(() => {
    const orderItems = orders.flatMap((order) => order.items || []);
    return {
      products: products.length,
      orders: orders.length,
      stock: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      revenue: orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || item.quantity || 0), 0),
    };
  }, [orders, products]);

  const categoryStock = useMemo(() => {
    const map: Record<string, number> = { veggies: 0, fruits: 0, grains: 0, dairy: 0, others: 0 };
    products.forEach((p) => {
      const cat = (p.category || '').toLowerCase();
      const stock = Number(p.stock) || 0;
      if (cat.includes('vegetable') || cat.includes('green') || cat.includes('root')) {
        map.veggies += stock;
      } else if (cat.includes('fruit')) {
        map.fruits += stock;
      } else if (cat.includes('daal') || cat.includes('grain') || cat.includes('seed')) {
        map.grains += stock;
      } else if (cat.includes('dairy') || cat.includes('egg')) {
        map.dairy += stock;
      } else {
        map.others += stock;
      }
    });
    return map;
  }, [products]);

  const vendorCustomers = useMemo(() => {
    const map: Record<string, { user: any; orderCount: number; totalSpend: number; lastOrderDate: string }> = {};
    orders.forEach((order) => {
      const u = order.user_id;
      if (!u || !u._id) return;
      const uid = String(u._id);
      if (!map[uid]) {
        map[uid] = {
          user: u,
          orderCount: 0,
          totalSpend: 0,
          lastOrderDate: order.createdAt,
        };
      }
      map[uid].orderCount += 1;
      map[uid].totalSpend += Number(order.total_amount || 0);
      if (new Date(order.createdAt) > new Date(map[uid].lastOrderDate)) {
        map[uid].lastOrderDate = order.createdAt;
      }
    });
    return Object.values(map);
  }, [orders]);

  const loadVendorData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const vendorId = session.user.id;

      const [productsRes, categoriesRes, profileRes, ordersRes, ridersRes] = await Promise.all([
        fetch(`/api/products?vendor_id=${vendorId}&limit=100`, { cache: 'no-store' }),
        fetch('/api/categories?limit=100', { cache: 'no-store' }),
        fetch(`/api/vendors/${vendorId}`, { cache: 'no-store' }),
        fetch('/api/orders?limit=100', { cache: 'no-store' }),
        fetch(`/api/delivery-boys?vendor_id=${vendorId}&limit=100`, { cache: 'no-store' }),
      ]);

      const [productsJson, categoriesJson, profileJson, ordersJson, ridersJson] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        profileRes.json(),
        ordersRes.json(),
        ridersRes.json(),
      ]);

      const loadedCategories = categoriesJson.data || [];
      setCategories(loadedCategories);

      const loadedProducts = (productsJson.data || []).map((p: any) => ({
        _id: p._id,
        name: p.product_name || p.name || '',
        category: p.category || '',
        categorySlug: p.categorySlug || (p.category || '').toLowerCase().replace(/\s+/g, '-'),
        price: Number(p.selling_price) || Number(p.price) || 0,
        mrp: Number(p.mrp) || 0,
        discount: Number(p.discount) || 0,
        stock: Number(p.stock_status) || Number(p.stock) || 0,
        image: p.product_image || p.image || '',
        description: p.product_description || p.description || '',
        weightOptions: p.weightOptions || [],
      }));
      setProducts(loadedProducts);

      const profileData = profileJson.data || {};
      setProfile({
        name: profileData.full_name || '',
        businessName: profileData.shop_name || '',
        phone: profileData.mobile_number || '',
        gstNumber: profileData.gst_number || '',
        address: profileData.address || '',
        shopImage: profileData.shop_image || '',
        gstVerified: !!profileData.gst_number,
        panDetails: 'ABCDE1234F',
        fssaiLicense: '23321008000142',
      });

      // Hybrid Notifications Data
      const dummyNotifications = [
        { id: 'n1', title: 'Refill Warning', message: 'Tomato stock is almost finished, quickly refill', time: 'Tue, 14 May, 10:00 AM', type: 'stock', isRead: false },
        { id: 'n2', title: 'Inventory Update', message: 'Vegetable stocks have been filled.', time: 'Wed, 15 May, 09:00 AM', type: 'rider', isRead: false },
        { id: 'n3', title: 'Auto Reorder', message: 'Spinach stock has been reordered.', time: 'Fri, 17 May, 10:00 AM', type: 'stock', isRead: true },
        { id: 'n4', title: 'Orders Filled', message: 'Weekly orders have been refilled.', time: 'Fri, 17 May, 06:00 PM', type: 'payout', isRead: true },
      ];
      setNotifications(dummyNotifications);

      setOrders(ordersJson.data || []);
      setRiders(ridersJson.data || []);

      setProductForm((current) => ({ ...current, categorySlug: current.categorySlug || loadedCategories[0]?.slug || '' }));
    } catch (e: any) {
      setMessage('Unable to load vendor data.');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated' || !session?.user) {
      router.push('/vendor/login');
      return;
    }
    if (session.user.role !== 'vendor' && session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadVendorData();
  }, [loadVendorData, router, session, status]);

  useEffect(() => {
    if (activeTab === 'negotiations') {
      fetchNegotiations();
    }
  }, [activeTab, fetchNegotiations]);

  const checkDuplicateCatalog = async (name: string) => {
    if (!name.trim()) {
      setMatchingGlobalProducts([]);
      return;
    }
    setSearchingGlobal(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(name)}&limit=5`);
      const json = await res.json();
      const items = json.data || [];
      setMatchingGlobalProducts(items.filter((item: any) =>
        (item.name || item.product_name || '').toLowerCase().includes(name.toLowerCase())
      ));
    } catch (err) {
      console.error('Error checking catalog:', err);
    } finally {
      setSearchingGlobal(false);
    }
  };

  useEffect(() => {
    if (editingId) return;
    const timer = setTimeout(() => {
      checkDuplicateCatalog(productForm.name);
    }, 500);
    return () => clearTimeout(timer);
  }, [productForm.name, editingId]);

  const resetProductForm = () => {
    setEditingId(null);
    setProductForm({ ...emptyProduct, categorySlug: categories[0]?.slug || '' });
    setMatchingGlobalProducts([]);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.user?.id) return;
    setSaving(true);
    setMessage('');

    try {
      const categoryData = categories.find((c) => c.slug === productForm.categorySlug);
      const categoryName = categoryData ? categoryData.name : productForm.categorySlug;

      const sellingPrice = Number(productForm.price);
      const disc = Number(productForm.discount) || 0;
      const mrp = disc > 0 ? Number((sellingPrice / (1 - disc / 100)).toFixed(2)) : sellingPrice;

      const payload = {
        product_name: productForm.name,
        selling_price: sellingPrice,
        mrp,
        stock: productForm.stock !== '' ? Number(productForm.stock) : 10,
        stock_status: Number(productForm.stock) > 0 ? 1 : 1,
        description: productForm.description,
        product_description: productForm.description,
        product_image: productForm.image,
        category: categoryName,
        vendor_id: session.user.id,
        vendor_shop_name: profile?.businessName || '',
        // Bulk selling fields
        is_bulk_available: Boolean(productForm.is_bulk_available),
        bulk_min_qty: Math.max(5, Number(productForm.bulk_min_qty) || 5),
        bulk_base_price: productForm.bulk_base_price !== '' ? Number(productForm.bulk_base_price) : sellingPrice,
        bulk_unit: productForm.bulk_unit || 'kg',
        bulk_stock: productForm.bulk_stock !== '' ? Number(productForm.bulk_stock) : Number(productForm.stock) || 0,
      };

      const url = editingId ? `/api/products/${editingId}` : `/api/products`;
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save product');

      resetProductForm();
      setShowProductModal(false);
      await loadVendorData();
      setMessage(editingId ? 'Product updated successfully.' : 'Product added successfully.');
    } catch (e: any) {
      setMessage('Unable to save product: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product: any) => {
    setEditingId(product._id);
    setProductForm({
      name: product.name || '',
      price: String(product.price ?? ''),
      discount: String(product.discount ?? '0'),
      stock: String(product.stock ?? '0'),
      description: product.description || '',
      image: product.image || '',
      categorySlug: product.categorySlug || categories[0]?.slug || '',
      weightOptions: product.weightOptions || [],
      is_bulk_available: Boolean(product.is_bulk_available),
      bulk_min_qty: String(product.bulk_min_qty || '5'),
      bulk_base_price: product.bulk_base_price !== undefined && product.bulk_base_price !== null ? String(product.bulk_base_price) : '',
      bulk_unit: product.bulk_unit || 'kg',
      bulk_stock: product.bulk_stock !== undefined && product.bulk_stock !== null ? String(product.bulk_stock) : '',
    });
    setShowProductModal(true);
  };

  const openAddProduct = () => {
    resetProductForm();
    setShowProductModal(true);
  };

  const closeModal = () => {
    resetProductForm();
    setShowProductModal(false);
  };

  const deleteProduct = async (product: any) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${product._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadVendorData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: 'Accepted', status: 1 }),
      });
      if (!res.ok) throw new Error('Failed to accept order');
      await loadVendorData();
      setMessage('Order accepted successfully.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const orderStatusMap: Record<string, { label: string; color: string }> = {
    'Order Placed': { label: 'Order Placed', color: 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/20 text-xs font-semibold' },
    'Order Confirmed': { label: 'Order Confirmed', color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-900/20 text-xs font-semibold' },
    'Packing': { label: 'Packing', color: 'bg-purple-100 dark:bg-purple-950/30 text-purple-800 dark:text-purple-450 border border-purple-200 dark:border-purple-900/20 text-xs font-semibold' },
    'Out for Delivery': { label: 'Out for Delivery', color: 'bg-indigo-100 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/20 text-xs font-semibold' },
    'Delivered': { label: 'Delivered', color: 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-900/20 text-xs font-semibold' },
    'Cancelled': { label: 'Cancelled', color: 'bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900/20 text-xs font-semibold' },
  };

  const orderColumns: Column<any>[] = [
    { key: 'order_number', label: 'Order No.' },
    {
      key: 'customer_mobile',
      label: 'Customer',
      render: (row) => row.user_id?.name || row.customer_mobile || 'Customer'
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (row) => <span className="font-semibold">₹{(row.total_amount ?? 0).toFixed(2)}</span>
    },
    {
      key: 'payment_method',
      label: 'Payment',
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${row.payment_method === 'COD' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
          {row.payment_method}
        </span>
      )
    },
    {
      key: 'payment_status',
      label: 'Pay Status',
      render: (row) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${row.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
            row.payment_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          }`}>{row.payment_status}</span>
      )
    },
    {
      key: 'orderStatus',
      label: 'Status',
      render: (row) => {
        const s = orderStatusMap[row.orderStatus] ?? { label: row.orderStatus || 'Unknown', color: 'bg-gray-100 text-gray-800' };
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.color}`}>{s.label}</span>;
      }
    },
    {
      key: 'rider',
      label: 'Rider',
      render: (row) => {
        const rider = row.delivery_boy_id;
        const isOnline = rider?.is_active === '1';
        const itemRiders = (row.items || row.populatedItems || []).filter((it: any) => it.delivery_boy_id && it.delivery_boy_id._id !== rider?._id);

        if (rider?.name) {
          return (
            <div className="flex flex-col gap-1 min-w-[130px]">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-500 shadow-xs shadow-green-500/50 animate-pulse' : 'bg-gray-400'}`} />
                <span className="font-bold text-gray-900 dark:text-white text-xs truncate max-w-[100px]">{rider.name}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                {rider.mobile_number && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">📞 {rider.mobile_number}</span>
                )}
              </div>
              {itemRiders.length > 0 && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">+{itemRiders.length} product rider(s)</span>
              )}
              {!(row.orderStatus === 'Delivered' || row.orderStatus === 'Cancelled') && (
                <button
                  type="button"
                  onClick={() => setAssignRiderModal({ open: true, orderId: row._id, currentRiderId: rider._id, itemId: null, itemName: null })}
                  className="text-[10px] text-primary hover:underline font-bold text-left cursor-pointer inline-flex items-center gap-0.5"
                >
                  <Bike size={11} /> Change Rider
                </button>
              )}
            </div>
          );
        }
        if (row.orderStatus === 'Delivered' || row.orderStatus === 'Cancelled') {
          return <span className="text-gray-400 text-xs font-semibold">Not Assigned</span>;
        }
        return (
          <button
            type="button"
            onClick={() => setAssignRiderModal({ open: true, orderId: row._id, currentRiderId: '', itemId: null, itemName: null })}
            className="inline-flex items-center gap-1 bg-green-50 text-primary border border-green-200 px-2.5 py-1 text-xs font-bold hover:bg-green-100 transition cursor-pointer rounded-lg"
          >
            <Bike size={13} />
            Assign Rider
          </button>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (row) => {
        const d = new Date(row.createdAt || row.created_at);
        const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return (
          <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold whitespace-nowrap leading-none flex flex-col gap-0.5">
            <span>{dateStr}</span>
            <span className="text-gray-450 dark:text-gray-500">{timeStr}</span>
          </div>
        );
      }
    },
  ];

  const orderActions: Action<any>[] = [
    {
      label: 'View',
      icon: <Eye size={15} />,
      onClick: (row) => setViewingOrder(row),
      color: 'default'
    },
    {
      label: 'Change Status',
      icon: <ArrowUpDown size={15} />,
      disabled: (row) => row.orderStatus === 'Delivered' || row.orderStatus === 'Cancelled',
      onClick: (row) => setOrderStatusModal({ open: true, orderId: row._id, current: row.orderStatus || 'Order Placed', otp: '' }),
      color: 'success'
    },
    {
      label: 'Assign Rider',
      icon: <Bike size={15} />,
      disabled: (row) => row.orderStatus === 'Delivered' || row.orderStatus === 'Cancelled',
      onClick: (row) => setAssignRiderModal({ open: true, orderId: row._id, currentRiderId: row.delivery_boy_id?._id || row.delivery_boy_id || '' }),
      color: 'primary'
    },
    {
      label: 'Delete',
      icon: <Trash2 size={15} />,
      onClick: async (row) => {
        if (!confirm(`Order ${row.order_number} delete करें?`)) return;
        await fetch(`/api/orders/${row._id}`, { method: 'DELETE' });
        fetchPaginatedOrders();
      },
      color: 'danger'
    }
  ];

  const fetchPaginatedOrders = useCallback(async () => {
    setOrderLoading(true);
    setOrderError('');
    try {
      const params = new URLSearchParams({ page: String(orderPage), limit: '10', search: orderSearch });
      if (orderFilterStatus !== '') params.set('status', orderFilterStatus);
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      setPaginatedOrders(json.data || []);
      setOrderTotalPages(json.meta?.totalPages || 1);
      setOrderTotal(json.meta?.total || 0);
    } catch (e: any) {
      setOrderError(e.message || 'Failed to load orders');
    } finally {
      setOrderLoading(false);
    }
  }, [orderPage, orderSearch, orderFilterStatus]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchPaginatedOrders();
    }
  }, [activeTab, fetchPaginatedOrders]);

  const applyOrderStatus = async (newStatus: string) => {
    if (!orderStatusModal.orderId) return;
    if (newStatus === 'Delivered' && !orderStatusModal.otp) {
      alert("Delivery OTP is required to mark the order as Delivered.");
      return;
    }
    try {
      const legacyMap: Record<string, number> = {
        'Order Placed': 0,
        'Order Confirmed': 1,
        'Packing': 2,
        'Out for Delivery': 3,
        'Delivered': 4,
        'Cancelled': 5
      };
      const res = await fetch(`/api/orders/${orderStatusModal.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: newStatus,
          status: legacyMap[newStatus],
          otp: orderStatusModal.otp
        }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Update failed');
      }
      fetchPaginatedOrders();
      loadVendorData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setOrderStatusModal({ open: false, orderId: null, current: 'Order Placed', otp: '' });
    }
  };

  const applyAssignRider = async (riderId: string) => {
    if (!assignRiderModal.orderId) return;
    try {
      const payload: any = { delivery_boy_id: riderId || null };
      if (assignRiderModal.itemId) {
        payload.item_id = assignRiderModal.itemId;
      }
      const res = await fetch(`/api/orders/${assignRiderModal.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to assign rider');
      }
      const json = await res.json();
      if (viewingOrder && viewingOrder._id === assignRiderModal.orderId) {
        setViewingOrder(json.data || null);
      }
      fetchPaginatedOrders();
      setMessage(assignRiderModal.itemName ? `Rider assigned for "${assignRiderModal.itemName}" successfully.` : 'Rider assigned to order successfully.');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAssignRiderModal({ open: false, orderId: null, currentRiderId: '', itemId: null, itemName: null });
    }
  };

  const toggleRiderActive = async (rider: any) => {
    try {
      const newVal = rider.is_active === '1' ? '0' : '1';
      const res = await fetch(`/api/delivery-boys/${rider._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newVal }),
      });
      if (!res.ok) throw new Error('Failed to update rider status');
      await loadVendorData();
      setMessage(`Rider ${rider.name} marked ${newVal === '1' ? 'Online' : 'Offline'}.`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const addRider = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!session?.user?.id) return;
    setSaving(true);
    setMessage('');

    try {
      const payload: any = {
        name: riderForm.name,
        email: riderForm.email,
        mobile_number: riderForm.mobile_number,
        vehicle_type: riderForm.vehicle_type,
        vehicle_number: riderForm.vehicle_number,
        vendor_id: session.user.id,
      };

      if (riderForm.password.trim()) {
        payload.password = riderForm.password;
      }

      const url = editingRiderId ? `/api/delivery-boys/${editingRiderId}` : '/api/delivery-boys';
      const method = editingRiderId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const isSuccess = editingRiderId ? res.ok : (res.ok && json.success);
      if (!isSuccess) throw new Error(json.error || 'Failed to save rider');

      setRiderForm({ name: '', email: '', mobile_number: '', password: '', vehicle_type: 'Bike', vehicle_number: '' });
      setEditingRiderId(null);
      setShowAddRiderModal(false);
      await loadVendorData();
      setMessage(editingRiderId ? 'Rider updated successfully.' : 'Rider registered successfully.');
    } catch (e: any) {
      setMessage('Unable to save rider: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const editRider = (rider: any) => {
    setEditingRiderId(rider._id);
    setRiderForm({
      name: rider.name || '',
      email: rider.email || '',
      mobile_number: rider.mobile_number || '',
      password: '',
      vehicle_type: rider.vehicle_type || 'Bike',
      vehicle_number: rider.vehicle_number || '',
    });
    setShowAddRiderModal(true);
  };

  const deleteRider = async (riderId: string, name: string) => {
    if (!window.confirm(`Delete rider "${name}"?`)) return;
    try {
      const res = await fetch(`/api/delivery-boys/${riderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await loadVendorData();
      setMessage('Rider deleted successfully.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: data });
      const json = await res.json();
      if (res.ok && json.success && json.urls?.[0]) {
        setProfile({ ...profile, shopImage: json.urls[0] });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setProfile({ ...profile, shopImage: reader.result as string });
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => setProfile({ ...profile, shopImage: reader.result as string });
      reader.readAsDataURL(file);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const vId = session?.user?.id || profile?._id || profile?.vendor_id || profile?.id;
    if (!vId) {
      setMessage('Unable to identify vendor account. Please re-login.');
      return;
    }
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/vendors/${vId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profile.name,
          shop_name: profile.businessName,
          mobile_number: profile.phone,
          gst_number: profile.gstNumber,
          address: profile.address,
          shop_image: profile.shopImage,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Failed to update profile');

      setMessage('Profile updated successfully!');
      await loadVendorData();
    } catch (e: any) {
      setMessage('Unable to update profile: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    await new Promise(r => setTimeout(r, 800));
    setMessage('Store settings updated successfully.');
    setSaving(false);
  };

  const getDeliveryAddress = (order: any) => {
    if (!order.user_id) return 'No address registered';
    if (order.user_id.addresses && order.address_id) {
      const addr = order.user_id.addresses.find((a: any) => String(a._id) === String(order.address_id));
      if (addr) {
        return `${addr.address_line_1 || ''}, ${addr.address_line_2 || ''}, ${addr.city || ''}, ${addr.state || ''} - ${addr.zip_code || ''}`;
      }
    }
    if (order.user_id.addresses && order.user_id.addresses.length > 0) {
      const defaultAddr = order.user_id.addresses.find((a: any) => a.is_default) || order.user_id.addresses[0];
      return `${defaultAddr.address_line_1 || ''}, ${defaultAddr.address_line_2 || ''}, ${defaultAddr.city || ''}, ${defaultAddr.state || ''} - ${defaultAddr.zip_code || ''}`;
    }
    return 'No address registered';
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  const downloadVendorReport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + [
        "Metric,Value",
        `Total Products,${products.length}`,
        `Total Orders,${orders.length}`,
        `Total Customers,${vendorCustomers.length}`,
        `Total Revenue,Rs ${stats.revenue.toFixed(2)}`
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vegking_vendor_report_${profile?.name || 'store'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className={`h-screen overflow-hidden flex font-sans antialiased transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0f172a] text-gray-100' : 'bg-[#f3f8f4] text-gray-800'}`}>
      {/* Sidebar Layout */}
      <aside className="hidden lg:flex flex-col w-56 bg-white dark:bg-gray-800 border-r border-[#e9f2eb] dark:border-gray-700 px-4 py-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 relative shrink-0 bg-white dark:bg-white/95 rounded-xl p-1 shadow-2xs border border-gray-100 dark:border-transparent">
              <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">VegKing</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {tabs.slice(0, 4).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const pendingNegotiations = negotiations.filter(n => n.status === 'OPEN' || n.status === 'COUNTERED').length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => changeTab(tab.id)}
                  className={`flex w-full items-center gap-3.5 px-4 py-3.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-[#edf7f0] dark:from-emerald-950/60 dark:to-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-xs scale-[1.01]'
                      : 'text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-[#f6faf7] dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'orders' && orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Order Placed').length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] font-bold h-5 px-1.5 min-w-5 rounded-full flex items-center justify-center animate-pulse shadow-sm shadow-red-200">
                      {orders.filter(o => o.orderStatus === 'Pending' || o.orderStatus === 'Order Placed').length}
                    </span>
                  )}
                  {tab.id === 'negotiations' && pendingNegotiations > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[9px] font-black h-5 px-1.5 min-w-5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      {pendingNegotiations}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="h-px bg-[#f0f6f2] dark:bg-gray-700 my-6" />

            {tabs.slice(4).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => changeTab(tab.id)}
                  className={`flex w-full items-center gap-3.5 px-4 py-3.5 rounded-xl text-left text-xs font-semibold transition-all duration-200 cursor-pointer ${isActive
                      ? 'bg-gradient-to-r from-emerald-50 to-[#edf7f0] dark:from-emerald-950/60 dark:to-emerald-900/40 text-emerald-700 dark:text-emerald-400 shadow-xs scale-[1.01]'
                      : 'text-gray-500 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-[#f6faf7] dark:hover:bg-gray-700/50 hover:scale-[1.01]'
                    }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'notifications' && unreadNotifCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[9px] font-black h-5 px-1.5 min-w-5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={() => { signOut(); router.push('/vendor/login'); }}
          className="flex w-full items-center gap-3.5 px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition"
        >
          <LogOut className="h-5 w-5 text-red-400" />
          Sign Out
        </button>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f3f8f4] dark:bg-gray-900">
        {/* Top Header Bar */}
        <header className="h-14 bg-white dark:bg-gray-800 border-b border-[#e9f2eb] dark:border-gray-700 px-4 lg:px-6 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 lg:hidden">
            <div className="h-9 w-9 relative shrink-0">
              <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-sm text-gray-900 dark:text-white">VegKing</span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <h2 className="font-extrabold text-xl text-gray-900 dark:text-white">Welcome to Market</h2>
            <button
              type="button"
              onClick={downloadVendorReport}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Download Shop Stats CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Download Report
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-6">
            <div className="relative hidden sm:block w-72">
              <input
                type="text"
                placeholder="Search..."
                className="w-full h-10 bg-[#f4f7f5] dark:bg-gray-700 rounded-xl pl-10 pr-4 text-xs font-semibold text-gray-700 dark:text-gray-250 placeholder-gray-400 border border-transparent focus:border-[#2bb673]/30 outline-none"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <button 
                type="button" 
                onClick={() => changeTab('negotiations')}
                className="p-2 hover:bg-[#f6faf7] dark:hover:bg-gray-700/50 hover:text-[#2bb673] rounded-xl transition cursor-pointer relative"
                title="Bulk Chat & Inquiries"
              >
                <MessageSquare className="h-5 w-5" />
                {negotiations.filter(n => n.status === 'OPEN' || n.status === 'COUNTERED').length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotificationDropdown((prev) => !prev)}
                  className={`p-2 hover:bg-[#f6faf7] dark:hover:bg-gray-700/50 hover:text-[#2bb673] rounded-xl transition relative cursor-pointer ${
                    showNotificationDropdown ? 'bg-[#edf7f0] text-emerald-700' : ''
                  }`}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 bg-red-500 text-white text-[9px] font-black rounded-full ring-2 ring-white flex items-center justify-center animate-pulse">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu anchored to Bell Icon */}
                {showNotificationDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotificationDropdown(false)}
                    />
                    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-[#e9f2eb] dark:border-gray-700 z-50 overflow-hidden animate-fadeIn text-left">
                      <div className="p-4 border-b border-[#f0f6f2] dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 to-white dark:from-gray-800 dark:to-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 flex items-center justify-center">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-xs text-gray-900 dark:text-white">Notifications</h4>
                            <p className="text-[10px] text-gray-400 font-semibold">{unreadNotifCount} unread alert{unreadNotifCount === 1 ? '' : 's'}</p>
                          </div>
                        </div>
                        {unreadNotifCount > 0 && (
                          <button
                            type="button"
                            onClick={() => markNotificationAsRead(undefined, true)}
                            className="text-[11px] font-extrabold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center text-xs text-gray-400 font-semibold">
                            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2 opacity-50" />
                            No alerts or inquiries right now
                          </div>
                        ) : (
                          notifications.slice(0, 15).map((item: any) => {
                            const isBulk = item.type === 'bulk_inquiry' || item.type === 'bulk_chat' || item.type === 'negotiation';
                            return (
                              <div
                                key={item._id || item.id}
                                onClick={() => handleNotificationClick(item)}
                                className={`p-3.5 flex gap-3 transition cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-gray-700/60 ${
                                  !item.isRead ? 'bg-emerald-50/20' : 'opacity-75'
                                }`}
                              >
                                <div className={`h-9 w-9 shrink-0 rounded-2xl flex items-center justify-center ${
                                  isBulk ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {isBulk ? <Scale className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1">
                                    <p className={`text-xs font-black truncate ${!item.isRead ? 'text-gray-950 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                      {item.title}
                                    </p>
                                    <span className="text-[9px] font-semibold text-gray-400 shrink-0">
                                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (item.time || '')}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-500 dark:text-gray-300 line-clamp-2 mt-0.5 leading-relaxed">
                                    {item.message}
                                  </p>
                                  {isBulk && (
                                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                      <MessageSquare className="w-3 h-3" />
                                      <span>Open Bulk Chat ➔</span>
                                    </span>
                                  )}
                                </div>
                                {!item.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-700 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNotificationDropdown(false);
                            changeTab('notifications');
                          }}
                          className="text-xs font-black text-emerald-700 hover:text-emerald-800 cursor-pointer"
                        >
                          View All in Notification Center ➔
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer flex items-center gap-1.5 text-xs font-extrabold shrink-0 shadow-2xs"
              title={isDarkMode ? "Currently Dark Mode (Click to switch to Light)" : "Currently Light Mode (Click to switch to Dark)"}
            >
              {isDarkMode ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              )}
            </button>

            <div className="h-8 w-px bg-[#f0f6f2] dark:bg-gray-700" />

            {/* Profile Menu */}
            <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => changeTab('profile')} title="View Store Profile">
              <div className="relative h-9 w-9 rounded-full overflow-hidden bg-green-50 border border-green-200 shrink-0 flex items-center justify-center">
                {profile?.shopImage ? (
                  <img src={profile.shopImage} alt={profile.name || 'Store Profile'} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-black text-gray-900 group-hover:text-[#2bb673] transition">{profile?.name || 'Seller'}</p>
                <p className="text-[10px] font-bold text-gray-400">{profile?.businessName || 'Merchant'}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-5 pb-20 lg:pb-6">
          {message && <div className="mb-6 rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold text-amber-700">{message}</div>}

          {/* HOME TAB (MODERN 3-COLUMN LAYOUT MATCHING IMAGE) */}
          {activeTab === 'home' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-fadeIn">

              {/* Column 1 & 2: Main Area */}
              <div className="xl:col-span-2 space-y-8">

                {/* Discount Special Banner */}
                <div className="bg-gradient-to-r from-[#2bb673] via-[#24a365] to-[#10b981] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col sm:flex-row justify-between sm:items-center gap-6 border border-emerald-500/10 shadow-lg shadow-emerald-700/5">
                  <div className="relative z-10 space-y-2.5 max-w-md">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Get special discounts up to 45%</h2>
                    <p className="text-xs text-emerald-50/90 font-semibold leading-relaxed">Enjoy listing your fresh vegetables, grains, and greens at competitive prices.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openAddProduct}
                    className="relative z-10 bg-white text-[#1e613f] hover:text-[#10b981] text-xs font-black px-6 py-3.5 rounded-2xl hover:bg-emerald-50 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-950/10 shrink-0 cursor-pointer"
                  >
                    Use Now
                  </button>
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4 select-none">
                    <Store className="h-64 w-64" />
                  </div>
                </div>

                {/* Categories and Stock */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Categories and Stock</h3>
                    <button type="button" className="border border-[#e9f2eb] dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold text-gray-500 dark:text-gray-300 px-3.5 py-2 rounded-xl flex items-center gap-2 hover:bg-[#f6faf7] dark:hover:bg-gray-700 transition">
                      <Filter className="h-3.5 w-3.5" />
                      Filter
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => <ShimmerCategoryCard key={i} />)
                    ) : (
                      [
                        { label: 'Veggies', stock: `${categoryStock.veggies} stock`, bg: 'bg-[#e7f7ee]/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300', iconBg: 'bg-emerald-600 text-white', icon: <Store className="h-4.5 w-4.5" /> },
                        { label: 'Tubers', stock: `${categoryStock.others} stock`, bg: 'bg-[#eefcf5]/60 dark:bg-green-950/30 border-green-100 dark:border-green-900/40 text-green-950 dark:text-green-300', iconBg: 'bg-green-600 text-white', icon: <Store className="h-4.5 w-4.5" /> },
                        { label: 'Grains', stock: `${categoryStock.grains} stock`, bg: 'bg-[#fffbeb]/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-900 dark:text-amber-300', iconBg: 'bg-amber-600 text-white', icon: <Store className="h-4.5 w-4.5" /> },
                        { label: 'Fruits', stock: `${categoryStock.fruits} stock`, bg: 'bg-[#fff5f0]/60 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/40 text-orange-950 dark:text-orange-300', iconBg: 'bg-orange-600 text-white', icon: <Store className="h-4.5 w-4.5" /> },
                        { label: 'Dairy', stock: `${categoryStock.dairy} stock`, bg: 'bg-[#eff6ff]/60 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-300', iconBg: 'bg-blue-600 text-white', icon: <Store className="h-4.5 w-4.5" /> },
                      ].map((cat) => (
                        <div key={cat.label} className={`border rounded-2xl p-4 flex flex-col gap-4 items-start hover:shadow-md hover:scale-[1.03] transition-all duration-300 ${cat.bg}`}>
                          <div className={`h-8 w-8 rounded-xl flex items-center justify-center shadow-xs ${cat.iconBg}`}>
                            {cat.icon}
                          </div>
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">{cat.stock}</p>
                            <p className="text-xs font-extrabold mt-0.5 leading-tight">{cat.label}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Popular Product List Grid */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Popular Product</h3>
                    <button type="button" onClick={() => changeTab('products')} className="text-xs font-bold text-[#2bb673] hover:underline">See All</button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => <ShimmerProductCard key={i} />)
                    ) : (
                      <>
                        {products.slice(0, 4).map((p) => {
                          const isFav = !!favorites[p._id];
                          return (
                            <div key={p._id} className="border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl p-3 flex flex-col justify-between hover:shadow-lg dark:hover:shadow-gray-950/60 hover:-translate-y-1 group transition-all duration-300">
                              <div className="relative h-28 w-full bg-[#f4f7f5] dark:bg-gray-700 rounded-xl overflow-hidden mb-3">
                                <img src={getSafeProductImage(p.image)} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite(p._id)}
                                  className="absolute top-2 right-2 h-7 w-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xs rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                                >
                                  <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                                </button>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-black text-sm text-gray-900 dark:text-white truncate">{p.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400">{p.stock} in stock</p>
                              </div>

                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#f6faf7] dark:border-gray-700">
                                <span className="text-sm font-black text-gray-950 dark:text-white">₹{Number(p.price).toFixed(2)}<span className="text-[10px] text-gray-400 font-bold">/kg</span></span>
                                <button
                                  type="button"
                                  onClick={() => editProduct(p)}
                                  className="h-7 w-7 bg-gradient-to-br from-[#2bb673] to-[#10b981] text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-all hover:scale-105 cursor-pointer shadow-xs"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {products.length === 0 && (
                          <div className="col-span-4 py-10 text-center border border-dashed border-[#e9f2eb] dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-400 text-xs font-semibold">
                            No products added yet. Go to Add Product to create one.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Top Items Grid */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Top Items</h3>
                    <button type="button" onClick={() => changeTab('products')} className="text-xs font-bold text-[#2bb673] hover:underline">See All</button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {loading ? (
                      Array.from({ length: 4 }).map((_, i) => <ShimmerProductCard key={i} />)
                    ) : (
                      <>
                        {products.slice(4, 8).map((p) => {
                          const isFav = !!favorites[p._id];
                          return (
                            <div key={p._id} className="border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl p-3 flex flex-col justify-between hover:shadow-lg dark:hover:shadow-gray-950/60 hover:-translate-y-1 group transition-all duration-300">
                              <div className="relative h-28 w-full bg-[#f4f7f5] dark:bg-gray-700 rounded-xl overflow-hidden mb-3">
                                <img src={getSafeProductImage(p.image)} alt={p.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite(p._id)}
                                  className="absolute top-2 right-2 h-7 w-7 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xs rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-red-500 transition-all cursor-pointer"
                                >
                                  <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                                </button>
                              </div>

                              <div className="space-y-1">
                                <h4 className="font-black text-sm text-gray-900 dark:text-white truncate">{p.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400">{p.stock} in stock</p>
                              </div>

                              <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#f6faf7] dark:border-gray-700">
                                <span className="text-sm font-black text-gray-950 dark:text-white">₹{Number(p.price).toFixed(2)}<span className="text-[10px] text-gray-400 font-bold">/kg</span></span>
                                <button
                                  type="button"
                                  onClick={() => editProduct(p)}
                                  className="h-7 w-7 bg-gradient-to-br from-[#2bb673] to-[#10b981] text-white rounded-lg flex items-center justify-center hover:bg-green-600 transition-all hover:scale-105 cursor-pointer shadow-xs"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {products.length < 5 && (
                          <div className="col-span-4 py-8 text-center border border-dashed border-[#e9f2eb] dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-400 text-xs font-semibold">
                            Add more products to populate Top Items section.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Column 3: Right Sidebar */}
              <div className="space-y-8">

                {/* Income Stat Panel */}
                <div className="border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl p-6 space-y-6 shadow-xs">
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Income</h3>

                  <div className="grid grid-cols-3 gap-4">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-3 animate-pulse">
                          <div className="h-14 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-10 mt-1" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-12 mt-1" />
                        </div>
                      ))
                    ) : (
                      [
                        { label: 'Daily', val: `₹${(stats.revenue * 0.15).toFixed(0)}`, pct: 45 },
                        { label: 'Weekly', val: `₹${(stats.revenue * 0.45).toFixed(0)}`, pct: 65 },
                        { label: 'Monthly', val: `₹${stats.revenue.toFixed(0)}`, pct: 85 },
                      ].map((inc) => (
                        <div key={inc.label} className="flex flex-col items-center gap-3">
                          {/* Circular Progress Ring */}
                          <div className="relative h-14 w-14 flex items-center justify-center">
                            <svg className="absolute transform -rotate-90 h-full w-full">
                              <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="3.5" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                              <circle cx="28" cy="28" r="22" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" fill="transparent"
                                strokeDasharray={138}
                                strokeDashoffset={138 - (138 * inc.pct) / 100}
                                className="filter drop-shadow-[0_2px_4px_rgba(16,185,129,0.25)]"
                              />
                            </svg>
                            <span className="text-[10px] font-black text-gray-600 dark:text-gray-300">{inc.pct}%</span>
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] font-black text-gray-900 dark:text-white">{inc.val}</p>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-0.5">{inc.label}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Notifications Log panel */}
                <div className="border border-[#e9f2eb] dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl p-6 space-y-5">
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Notification</h3>

                  <div className="space-y-4">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex gap-4 items-center animate-pulse">
                          <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                          <div className="space-y-2 w-full">
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-2/3" />
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4" />
                          </div>
                        </div>
                      ))
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 group cursor-pointer" onClick={() => changeTab('notifications')}>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#2bb673] transition-colors line-clamp-2 leading-snug">{item.message}</p>
                            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1">{item.time}</p>
                          </div>
                          <ChevronDown className="h-4 w-4 text-gray-400 transform -rotate-90 shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Latest Orders Accept Table panel */}
                <div className="border border-[#e9f2eb] dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl p-6 space-y-5">
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Latest order</h3>

                  <div className="divide-y divide-[#f6faf7] dark:divide-gray-700">
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="py-3 flex items-center justify-between gap-4 animate-pulse">
                          <div className="space-y-2 w-full">
                            <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2" />
                            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4" />
                          </div>
                          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0" />
                        </div>
                      ))
                    ) : (
                      <>
                        {orders.slice(0, 4).map((order) => {
                          const itemsText = order.items?.map((it: any) => `${it.product_name || it.name} (${it.qty || it.quantity})`).join(', ') || 'Produce';
                          const isPending = order.orderStatus === 'Pending';
                          return (
                            <div key={order._id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                              <div className="min-w-0">
                                <p className="text-xs font-black text-gray-900 dark:text-white truncate">{order.userId?.name || 'Customer'}</p>
                                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 truncate mt-0.5">{itemsText}</p>
                              </div>
                              {isPending ? (
                                <button
                                  type="button"
                                  onClick={() => acceptOrder(order._id)}
                                  className="bg-[#2bb673] text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg hover:bg-green-600 transition shrink-0"
                                >
                                  Accept
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="bg-[#e7f7ee] text-[#2bb673] text-[10px] font-black px-3 py-1 rounded-lg shrink-0">
                                    Accepted
                                  </span>
                                  {!order.delivery_boy_id && (
                                    <button
                                      type="button"
                                      onClick={() => setAssignRiderModal({ open: true, orderId: order._id, currentRiderId: '' })}
                                      className="bg-primary hover:bg-primary-hover text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition shrink-0 flex items-center gap-1"
                                    >
                                      <Bike size={12} />
                                      Assign Rider
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {orders.length === 0 && (
                          <p className="py-6 text-center text-xs font-bold text-gray-400">No orders placed yet.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}



          {activeTab === 'products' && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 p-5 sm:p-8 animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Products</h1>
                <button
                  type="button"
                  onClick={openAddProduct}
                  className="bg-[#2bb673] px-5 py-2.5 text-xs font-extrabold text-white rounded-xl hover:bg-green-600 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>
              <div className="grid gap-4">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <ShimmerListRow key={i} />)
                ) : (
                  <>
                    {products.map((product) => (
                      <div key={product._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-700/80 shadow-xs">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-100 dark:border-gray-600">
                            <img src={getSafeProductImage(product.image)} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                          <div>
                            <h2 className="font-black text-gray-950 dark:text-white text-sm sm:text-base">{product.name}</h2>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-300">{product.category} &bull; ₹{Number(product.price).toFixed(2)} &bull; {product.stock} in stock</p>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end sm:justify-start">
                          <button type="button" onClick={() => editProduct(product)} className="bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-2 text-xs sm:text-sm font-black text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer">Edit</button>
                          <button type="button" onClick={() => deleteProduct(product)} className="bg-red-50 dark:bg-red-950/40 rounded-lg px-4 py-2 text-xs sm:text-sm font-black text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition cursor-pointer">Delete</button>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && <p className="py-10 text-center text-sm font-bold text-gray-500 dark:text-gray-400">No products added yet.</p>}
                  </>
                )}
              </div>
            </section>
          )}

          {activeTab === 'orders' && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-5 animate-fadeIn space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black text-gray-900 dark:text-white">Orders</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Total: {orderTotal} orders</p>
                </div>
              </div>

              {orderError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  ⚠️ {orderError} — <button onClick={fetchPaginatedOrders} className="underline font-bold">Retry</button>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Search order no..."
                  value={orderSearch}
                  onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs w-52 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <select
                  value={orderFilterStatus}
                  onChange={(e) => { setOrderFilterStatus(e.target.value); setOrderPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">All Status</option>
                  {Object.entries(orderStatusMap).map(([val, s]) => (
                    <option key={val} value={val}>{s.label}</option>
                  ))}
                </select>
              </div>

              <DataTable
                data={paginatedOrders}
                columns={orderColumns}
                actions={orderActions}
                keyExtractor={(row) => row._id}
                loading={orderLoading}
                hideToolbar={true}
              />

              {/* Pagination */}
              {orderTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Page {orderPage} of {orderTotalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setOrderPage(p => Math.max(1, p - 1))} disabled={orderPage === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">← Prev</button>
                    <button onClick={() => setOrderPage(p => Math.min(orderTotalPages, p + 1))} disabled={orderPage === orderTotalPages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 cursor-pointer">Next →</button>
                  </div>
                </div>
              )}

              {/* Change Status Modal */}
              {orderStatusModal.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-80">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Change Order Status</h3>
                    <select
                      value={orderStatusModal.current}
                      onChange={(e) => setOrderStatusModal(m => ({ ...m, current: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      {Object.entries(orderStatusMap).map(([val, s]) => (
                        <option key={val} value={val}>{s.label}</option>
                      ))}
                    </select>

                    {orderStatusModal.current === 'Delivered' && (
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Delivery OTP</label>
                        <input
                          type="text"
                          placeholder="Enter 4-digit OTP"
                          value={orderStatusModal.otp}
                          onChange={(e) => setOrderStatusModal(m => ({ ...m, otp: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => setOrderStatusModal({ open: false, orderId: null, current: 'Order Placed', otp: '' })}
                        className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >Cancel</button>
                      <button
                        onClick={() => applyOrderStatus(orderStatusModal.current)}
                        className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                      >Apply</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Assign Rider Modal */}
              {assignRiderModal.open && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Bike className="text-primary w-5 h-5" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {assignRiderModal.itemName ? 'Assign Rider for Product' : 'Assign Order Rider'}
                      </h3>
                    </div>
                    {assignRiderModal.itemName && (
                      <div className="mb-3 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/40 text-xs font-semibold text-green-900 dark:text-green-300">
                        📦 Product: <span className="font-bold">{assignRiderModal.itemName}</span>
                      </div>
                    )}
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Delivery Boy</label>
                    <select
                      value={assignRiderModal.currentRiderId}
                      onChange={(e) => setAssignRiderModal(m => ({ ...m, currentRiderId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm mb-4 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Unassigned / Select Rider</option>
                      {riders.map((r: any) => (
                        <option key={r._id} value={r._id}>
                          {r.is_active === '1' ? '🟢 Online' : '⚪ Offline'} | {r.name} ({r.vehicle_type || 'Bike'} - {r.mobile_number})
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAssignRiderModal({ open: false, orderId: null, currentRiderId: '', itemId: null, itemName: null })}
                        className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer font-bold text-gray-700 dark:text-gray-300"
                      >Cancel</button>
                      <button
                        onClick={() => applyAssignRider(assignRiderModal.currentRiderId)}
                        className="flex-1 px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 cursor-pointer font-bold shadow-sm"
                      >Assign Rider</button>
                    </div>
                  </div>
                </div>
              )}

              {/* View Order Details Modal */}
              {viewingOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Details</h3>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">#{viewingOrder.order_number || viewingOrder._id}</p>
                      </div>
                      <button
                        onClick={() => setViewingOrder(null)}
                        className="text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 cursor-pointer text-xl"
                      >✕</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Customer Details</h4>
                          <p className="font-bold text-gray-800 dark:text-gray-200 mt-1">{viewingOrder.user_id?.name || 'Walk-in / Online Customer'}</p>
                          {viewingOrder.user_id?.mobile_no && <p className="text-gray-500 font-semibold mt-0.5">Phone: {viewingOrder.user_id.mobile_no}</p>}
                          {viewingOrder.user_id?.email && <p className="text-gray-500 font-semibold">Email: {viewingOrder.user_id.email}</p>}
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Delivery Address</h4>
                          <p className="text-gray-600 dark:text-gray-300 font-semibold mt-1 leading-relaxed">{getDeliveryAddress(viewingOrder)}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Order Info</h4>
                          <p className="text-gray-600 dark:text-gray-300 font-semibold mt-1">Date: {new Date(viewingOrder.createdAt).toLocaleString()}</p>
                          <p className="text-gray-600 dark:text-gray-300 font-semibold">Status: <span className="font-bold text-green-600">{viewingOrder.orderStatus}</span></p>
                          <div className="text-gray-600 dark:text-gray-300 font-semibold flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>Order Rider:</span>
                              {viewingOrder.delivery_boy_id?.name ? (
                                <>
                                  <span className={`w-2 h-2 rounded-full shrink-0 ${viewingOrder.delivery_boy_id.is_active === '1' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                  <span className="font-bold text-gray-800 dark:text-gray-200">{viewingOrder.delivery_boy_id.name}</span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${viewingOrder.delivery_boy_id.is_active === '1' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700'}`}>
                                    {viewingOrder.delivery_boy_id.is_active === '1' ? 'Online' : 'Offline'}
                                  </span>
                                  {viewingOrder.delivery_boy_id.mobile_number && (
                                    <span className="text-xs text-gray-500 font-medium">({viewingOrder.delivery_boy_id.mobile_number})</span>
                                  )}
                                </>
                              ) : (
                                <span className="font-semibold text-gray-400">Not Assigned</span>
                              )}
                              {!(viewingOrder.orderStatus === 'Delivered' || viewingOrder.orderStatus === 'Cancelled') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssignRiderModal({
                                      open: true,
                                      orderId: viewingOrder._id,
                                      currentRiderId: viewingOrder.delivery_boy_id?._id || viewingOrder.delivery_boy_id || '',
                                      itemId: null,
                                      itemName: null
                                    });
                                  }}
                                  className="text-xs text-primary font-bold hover:underline cursor-pointer inline-flex items-center gap-0.5 ml-1"
                                >
                                  (<Bike size={12} className="inline" /> {viewingOrder.delivery_boy_id ? 'Change' : 'Assign'})
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 font-semibold">Payment Method: {viewingOrder.payment_method}</p>
                          <p className="text-gray-600 dark:text-gray-300 font-semibold">Payment Status: {viewingOrder.payment_status}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Products & Rider Assignment</h4>
                        <span className="text-[11px] text-gray-500">Assign rider per specific product or order</span>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl px-4 bg-gray-50/50 dark:bg-gray-900/50">
                        {(viewingOrder.items || viewingOrder.populatedItems || []).map((item: any) => {
                          const itemRider = item.delivery_boy_id;
                          const effectiveRider = itemRider || viewingOrder.delivery_boy_id;
                          const isItemOnline = effectiveRider?.is_active === '1';

                          return (
                            <div key={item._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-3">
                                {item.image && (
                                  <img
                                    src={getSafeProductImage(item.image)}
                                    alt={item.product_name || item.name}
                                    className="w-11 h-11 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shrink-0"
                                  />
                                )}
                                <div>
                                  <span className="font-bold text-gray-800 dark:text-gray-200 block">
                                    {(item.product_name || item.name)}{' '}
                                    <span className="text-xs text-gray-400 font-bold">x {(item.qty || item.quantity)}</span>
                                  </span>

                                  {/* Specific Rider Assignment Info */}
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    {effectiveRider ? (
                                      <>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${isItemOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                          Rider: <span className="font-bold">{effectiveRider.name}</span>
                                          {!itemRider && viewingOrder.delivery_boy_id && (
                                            <span className="text-[10px] text-gray-400 font-normal ml-1">(Default)</span>
                                          )}
                                        </span>
                                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${isItemOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700'}`}>
                                          {isItemOnline ? 'Online' : 'Offline'}
                                        </span>
                                        {effectiveRider.mobile_number && (
                                          <span className="text-[10px] text-gray-400">({effectiveRider.mobile_number})</span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-gray-400 font-medium">Rider: Unassigned</span>
                                    )}

                                    {!(viewingOrder.orderStatus === 'Delivered' || viewingOrder.orderStatus === 'Cancelled') && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAssignRiderModal({
                                            open: true,
                                            orderId: viewingOrder._id,
                                            currentRiderId: itemRider?._id || '',
                                            itemId: item._id,
                                            itemName: item.product_name || item.name
                                          });
                                        }}
                                        className="text-xs text-primary font-bold hover:underline cursor-pointer ml-1 inline-flex items-center gap-0.5"
                                      >
                                        <Bike size={11} /> {itemRider ? 'Change Rider' : 'Assign Rider'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <span className="font-black text-gray-950 dark:text-white shrink-0">
                                ₹{(Number(item.price) * Number(item.qty || item.quantity)).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between items-center px-4 pt-1">
                        <span className="text-xs font-bold text-gray-500">Total Bill</span>
                        <span className="text-base font-black text-gray-950 dark:text-white">₹{Number(viewingOrder.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setViewingOrder(null)}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 transition text-sm font-bold cursor-pointer"
                      >Close</button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'negotiations' && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-6 animate-fadeIn space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-gray-900 dark:text-white">Bulk Inquiries & Negotiations</h1>
                    <span className="bg-amber-400 text-gray-950 font-black text-xs px-2.5 py-0.5 rounded-full">
                      {negotiations.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">Chat directly with bulk buyers, negotiate rates, and seal wholesale deals.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchNegotiations}
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 text-gray-600 text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {negotiationLoading ? (
                <div className="p-12 text-center text-gray-400 text-sm">Loading bulk inquiries...</div>
              ) : negotiations.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 space-y-2">
                  <Scale className="w-12 h-12 text-gray-400 mx-auto" />
                  <h3 className="font-bold text-gray-700 dark:text-gray-200">No Bulk Inquiries Yet</h3>
                  <p className="text-xs text-gray-400">When customers request bulk quotes (5 kg or more) for your products, they will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Inquiries Sidebar */}
                  <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {negotiations.map((n) => {
                      const isSelected = selectedNegotiation?._id === n._id;
                      return (
                        <div
                          key={n._id}
                          onClick={() => openNegotiation(n)}
                          className={`p-4 rounded-2xl border transition cursor-pointer space-y-2.5 ${
                            isSelected
                              ? 'border-green-600 bg-green-50/50 dark:bg-green-950/20 shadow-sm'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-green-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <img src={n.product_image || '/images/product-card-default.jpg'} alt={n.product_name} className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0" />
                              <div>
                                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate max-w-[170px]">{n.product_name}</h4>
                                <p className="text-xs text-gray-500">{n.customer_name || 'Customer'}</p>
                              </div>
                            </div>

                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              n.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                              n.status === 'COUNTERED' ? 'bg-amber-100 text-amber-800' :
                              n.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {n.status}
                            </span>
                          </div>

                          <div className="p-2.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl flex items-center justify-between text-xs font-semibold">
                            <div>
                              <span className="text-gray-400 text-[10px] block">Requested:</span>
                              <span className="text-gray-800 dark:text-gray-200">{n.requested_qty} {n.unit || 'kg'}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-400 text-[10px] block">Offer Rate:</span>
                              <span className="text-green-600 font-extrabold">₹{n.current_counter_price || n.initial_offer_price}/{n.unit || 'kg'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Chat & Action Panel */}
                  <div className="lg:col-span-7 border border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 p-4 sm:p-5 flex flex-col min-h-[500px] justify-between">
                    {selectedNegotiation ? (
                      <div className="flex flex-col h-full space-y-4">
                        
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                          <div>
                            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">{selectedNegotiation.product_name}</h3>
                            <p className="text-xs text-gray-500">
                              Buyer: <strong className="text-gray-700 dark:text-gray-300">{selectedNegotiation.customer_name}</strong> {selectedNegotiation.customer_mobile && `(${selectedNegotiation.customer_mobile})`}
                            </p>
                          </div>

                          {selectedNegotiation.status === 'ACCEPTED' ? (
                            <span className="bg-green-100 text-green-800 font-mono font-bold text-xs px-2.5 py-1 rounded-full border border-green-300">
                              Deal Token: {selectedNegotiation.deal_token}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVendorAction('ACCEPT')}
                                disabled={actionSending}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-extrabold shadow flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Deal (₹{selectedNegotiation.current_counter_price}/{selectedNegotiation.unit})</span>
                              </button>
                              <button
                                onClick={() => handleVendorAction('REJECT')}
                                disabled={actionSending}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Messages Stream */}
                        <div className="flex-1 overflow-y-auto space-y-3 min-h-[250px] max-h-[350px] p-2 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                          {negotiationMessages.map((msg: any, i: number) => {
                            const isVendor = msg.sender_role === 'vendor';
                            return (
                              <div key={msg._id || i} className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] font-bold text-gray-400 px-1 mb-0.5">
                                  {isVendor ? 'You' : msg.sender_name || 'Buyer'}
                                </span>
                                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-xs ${
                                  isVendor
                                    ? 'bg-green-600 text-white rounded-tr-none'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none'
                                }`}>
                                  <p>{msg.message}</p>
                                  {msg.proposed_price && (
                                    <div className="mt-1 font-bold text-[10px] opacity-90">
                                      Offered Rate: ₹{msg.proposed_price}/{selectedNegotiation.unit}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Vendor Reply & Counter Form */}
                        {selectedNegotiation.status !== 'ACCEPTED' && selectedNegotiation.status !== 'REJECTED' && (
                          <form onSubmit={handleVendorSendMessage} className="pt-2 space-y-2 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold">
                              <span className="text-gray-400">Min 5kg+:</span>
                              {[5, 10, 25, 50, 100].map((qVal) => (
                                <button
                                  key={qVal}
                                  type="button"
                                  onClick={() => setVendorChatInput(`I can supply ${qVal} ${selectedNegotiation.unit || 'kg'} at ₹${vendorCounterInput || selectedNegotiation.current_counter_price}/${selectedNegotiation.unit || 'kg'}`)}
                                  className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 rounded-md border border-amber-300 dark:border-amber-700 cursor-pointer"
                                >
                                  {qVal} {selectedNegotiation.unit || 'kg'}
                                </button>
                              ))}
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step={0.01}
                                value={vendorCounterInput}
                                onChange={(e) => setVendorCounterInput(e.target.value)}
                                placeholder="Counter ₹/kg"
                                className="w-32 h-10 px-2.5 border border-amber-300 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 focus:outline-none"
                              />
                              <input
                                type="text"
                                value={vendorChatInput}
                                onChange={(e) => setVendorChatInput(e.target.value)}
                                placeholder="Send message to buyer..."
                                className="flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                              />
                              <button
                                type="submit"
                                disabled={actionSending || (!vendorChatInput.trim() && !vendorCounterInput)}
                                className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs shadow flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shrink-0"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send</span>
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-gray-400 text-xs">
                        Select a bulk inquiry from the list to view chat and manage negotiation offers.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'customers' && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 p-5 sm:p-8 animate-fadeIn space-y-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Customers</h1>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-300">Customers who have ordered products from your shop.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[650px]">
                  <thead>
                    <tr className="border-b border-[#f6faf7] dark:border-gray-700 text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                      <th className="py-4">Customer</th>
                      <th className="py-4">Mobile</th>
                      <th className="py-4 text-center">Orders</th>
                      <th className="py-4 text-right">Total Spent</th>
                      <th className="py-4 text-right">Last Purchase</th>
                      <th className="py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f6faf7] dark:divide-gray-700/50">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td className="py-4">
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-28" />
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-20" />
                            </div>
                          </td>
                          <td className="py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-24" /></td>
                          <td className="py-4 text-center"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-8 mx-auto" /></td>
                          <td className="py-4 text-right"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-16 ml-auto" /></td>
                          <td className="py-4 text-right"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-20 ml-auto" /></td>
                          <td className="py-4 text-right"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : (
                      vendorCustomers.map((cust) => (
                        <tr key={cust.user._id} className="text-sm hover:bg-[#fcfdfd] dark:hover:bg-gray-700/50">
                          <td className="py-4">
                            <div>
                              <p className="font-black text-gray-950 dark:text-white">{cust.user.name || 'Walk-in'}</p>
                              <p className="text-xs text-gray-400 font-semibold mt-0.5">{cust.user.email || 'No email'}</p>
                            </div>
                          </td>
                          <td className="py-4 font-semibold text-gray-600 dark:text-gray-300">{cust.user.mobile_no || 'N/A'}</td>
                          <td className="py-4 text-center font-bold text-gray-950 dark:text-white">{cust.orderCount}</td>
                          <td className="py-4 text-right font-black text-[#2bb673] dark:text-emerald-400">₹{cust.totalSpend.toFixed(2)}</td>
                          <td className="py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">
                            {new Date(cust.lastOrderDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm(`"${cust.user.name || 'Walk-in'}" customer को delete करें?`)) return;
                                await fetch(`/api/users/${cust.user._id}`, { method: 'DELETE' });
                                loadVendorData();
                              }}
                              className="bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 font-extrabold text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {vendorCustomers.length === 0 && (
                  <p className="py-12 text-center text-sm font-bold text-gray-500 dark:text-gray-400">No customers found.</p>
                )}
              </div>
            </section>
          )}

          {activeTab === 'riders' && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 p-5 sm:p-8 animate-fadeIn space-y-6">
              <div className="flex justify-between items-center mb-5">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">My Riders</h1>
                <button
                  type="button"
                  onClick={() => {
                    if (showAddRiderModal) {
                      setEditingRiderId(null);
                      setRiderForm({ name: '', email: '', mobile_number: '', password: '', vehicle_type: 'Bike', vehicle_number: '' });
                    }
                    setShowAddRiderModal(!showAddRiderModal);
                  }}
                  className="bg-[#2bb673] px-4 py-2 text-xs font-extrabold text-white rounded-xl hover:bg-green-600 transition cursor-pointer shadow-xs"
                >
                  {showAddRiderModal ? 'Close Form' : 'Add Rider'}
                </button>
              </div>

              {showAddRiderModal && (
                <div className="mb-6 p-6 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700/60 relative animate-fadeIn">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 mb-4">
                    {editingRiderId ? 'Edit Rider Details' : 'Register New Rider'}
                  </h3>
                  <form onSubmit={addRider} className="grid gap-4 sm:grid-cols-2">
                    <input className="h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white" placeholder="Rider Name" value={riderForm.name} onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })} required />
                    <input type="email" className="h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white" placeholder="Email Address" value={riderForm.email} onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })} required />
                    <input className="h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white" placeholder="Mobile Number" value={riderForm.mobile_number} onChange={(e) => setRiderForm({ ...riderForm, mobile_number: e.target.value })} maxLength={10} required />
                    <input
                      type="password"
                      className="h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white"
                      placeholder={editingRiderId ? "Password (leave blank to keep current)" : "Password"}
                      value={riderForm.password}
                      onChange={(e) => setRiderForm({ ...riderForm, password: e.target.value })}
                      required={!editingRiderId}
                    />

                    <select className="h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white cursor-pointer" value={riderForm.vehicle_type} onChange={(e) => setRiderForm({ ...riderForm, vehicle_type: e.target.value })} required>
                      <option value="Bike" className="text-gray-900 dark:text-white dark:bg-gray-800">Bike</option>
                      <option value="Scooter" className="text-gray-900 dark:text-white dark:bg-gray-800">Scooter</option>
                      <option value="Cycle" className="text-gray-900 dark:text-white dark:bg-gray-800">Cycle</option>
                      <option value="Van" className="text-gray-900 dark:text-white dark:bg-gray-800">Van</option>
                      <option value="Auto" className="text-gray-900 dark:text-white dark:bg-gray-800">Auto</option>
                    </select>

                    <input className="h-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white" placeholder="Vehicle Number" value={riderForm.vehicle_number} onChange={(e) => setRiderForm({ ...riderForm, vehicle_number: e.target.value })} required />

                    <div className="flex gap-3 sm:col-span-2">
                      {editingRiderId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRiderId(null);
                            setRiderForm({ name: '', email: '', mobile_number: '', password: '', vehicle_type: 'Bike', vehicle_number: '' });
                            setShowAddRiderModal(false);
                          }}
                          className="flex-1 h-12 items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-extrabold text-gray-700 dark:text-gray-200 rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button type="submit" disabled={saving} className="flex-1 h-12 items-center justify-center gap-2 bg-[#2bb673] text-sm font-extrabold text-white rounded-xl hover:bg-green-600 transition disabled:opacity-70 cursor-pointer">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingRiderId ? 'Save Changes' : 'Register Rider')}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="mt-5 grid gap-4">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-between gap-4 animate-pulse">
                      <div className="space-y-2 w-full">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2 animate-pulse" />
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12 animate-pulse" />
                      </div>
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg shrink-0 animate-pulse" />
                    </div>
                  ))
                ) : (
                  <>
                    {riders.map((rider) => {
                      const isOnline = rider.is_active === '1';
                      return (
                        <div key={rider._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 bg-white dark:bg-gray-700/80 shadow-xs hover:shadow-md transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-green-500 shadow-xs shadow-green-500/50 animate-pulse' : 'bg-gray-400'}`} />
                              <h2 className="font-black text-gray-950 dark:text-white text-sm sm:text-base">{rider.name || rider.mobile_number}</h2>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isOnline ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            <p className="mt-1 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-300">
                              {rider.name ? rider.mobile_number + ' \u2022 ' : ''}{rider.vehicle_type} ({rider.vehicle_number || 'No plate'})
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {rider.vendor_id ? 'Dedicated Vendor Rider' : 'Platform / Shared Rider'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 justify-end sm:justify-start flex-wrap">
                            <button
                              type="button"
                              onClick={() => toggleRiderActive(rider)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${isOnline ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100' : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100'}`}
                            >
                              {isOnline ? 'Go Offline' : 'Go Online'}
                            </button>
                            <button type="button" onClick={() => setViewingRider(rider)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-1.5 text-xs font-black text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition cursor-pointer">View</button>
                            <button type="button" onClick={() => editRider(rider)} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3.5 py-1.5 text-xs font-black text-[#2bb673] dark:text-emerald-400 hover:bg-[#eaf9f1] dark:hover:bg-gray-600 transition cursor-pointer">Edit</button>
                            <button type="button" onClick={() => deleteRider(rider._id, rider.name)} className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl px-3.5 py-1.5 text-xs font-black text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition cursor-pointer">Delete</button>
                          </div>
                        </div>
                      );
                    })}
                    {riders.length === 0 && <p className="py-10 text-center text-sm font-bold text-gray-500 dark:text-gray-400">No riders registered yet.</p>}
                  </>
                )}
              </div>

              {/* View Rider Details Modal */}
              {viewingRider && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md w-full p-6 space-y-6 animate-fadeIn border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rider Details</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">ID: {viewingRider._id}</p>
                      </div>
                      <button
                        onClick={() => setViewingRider(null)}
                        className="text-gray-400 hover:text-gray-650 dark:hover:text-gray-200 cursor-pointer text-xl"
                      >✕</button>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-400 font-bold uppercase text-xs">Name:</span>
                        <span className="col-span-2 font-bold text-gray-850 dark:text-gray-200">{viewingRider.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-400 font-bold uppercase text-xs">Email:</span>
                        <span className="col-span-2 font-semibold text-gray-600 dark:text-gray-300">{viewingRider.email}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-400 font-bold uppercase text-xs">Mobile:</span>
                        <span className="col-span-2 font-semibold text-gray-600 dark:text-gray-300">{viewingRider.mobile_number}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-400 font-bold uppercase text-xs">Vehicle Type:</span>
                        <span className="col-span-2 font-semibold text-gray-600 dark:text-gray-300">{viewingRider.vehicle_type}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-400 font-bold uppercase text-xs">Vehicle No:</span>
                        <span className="col-span-2 font-mono font-bold text-gray-800 dark:text-gray-200">{viewingRider.vehicle_number}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-400 font-bold uppercase text-xs">Status:</span>
                        <span className="col-span-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${viewingRider.is_active === '1' ? 'bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'}`}>
                            {viewingRider.is_active === '1' ? 'Online' : 'Offline'}
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-gray-400 font-bold uppercase text-xs">Created At:</span>
                        <span className="col-span-2 text-gray-600 dark:text-gray-300">{new Date(viewingRider.createdAt || viewingRider.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => setViewingRider(null)}
                        className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-bold cursor-pointer"
                      >Close</button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'notifications' && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 p-5 sm:p-8 space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-5">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                    <Bell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <span>Alerts & Notifications Center</span>
                  </h1>
                  <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-300">
                    Real-time bulk purchase inquiries, buyer negotiations, order updates, and inventory tracking.
                  </p>
                </div>
                {unreadNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markNotificationAsRead(undefined, true)}
                    className="self-start sm:self-auto px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs rounded-xl transition cursor-pointer border border-emerald-200 dark:border-emerald-800"
                  >
                    Mark All As Read ({unreadNotifCount})
                  </button>
                )}
              </div>

              <div className="divide-y divide-[#f6faf7] dark:divide-gray-700/50">
                {notifications.map((item) => {
                  const isBulk = item.type === 'bulk_inquiry' || item.type === 'bulk_chat' || item.type === 'negotiation';
                  return (
                    <div
                      key={item._id || item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`py-4 px-3 sm:px-4 flex gap-4 transition rounded-2xl cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-gray-700/60 ${
                        !item.isRead ? 'bg-emerald-50/25 dark:bg-emerald-950/20 border-l-4 border-emerald-500' : 'opacity-85'
                      }`}
                    >
                      <div className={`h-11 w-11 shrink-0 rounded-2xl flex items-center justify-center ${
                        isBulk ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        {isBulk ? <Scale className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`text-sm font-black ${!item.isRead ? 'text-gray-950 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                              {item.title}
                            </h3>
                            {isBulk && (
                              <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                                🌾 Bulk Deal
                              </span>
                            )}
                            {!item.isRead && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleString() : (item.time || '')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                          {item.message}
                        </p>
                        {isBulk && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(item);
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Open Negotiation Chat & Deal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="py-16 text-center text-sm font-bold text-gray-400">
                    <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3 opacity-50" />
                    <p>No notifications or alerts yet.</p>
                  </div>
                )}
              </div>
            </section>
          )}
          {activeTab === 'profile' && profile && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 p-5 sm:p-8 space-y-8 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Store Profile</h1>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-300">View and update your registration parameters.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { title: 'GSTIN Verified', val: profile.gstNumber },
                  { title: 'FSSAI License Active', val: profile.fssaiLicense },
                  { title: 'PAN Registered', val: profile.panDetails },
                ].map((doc) => (
                  <div key={doc.title} className="border border-[#e9f2eb] dark:border-gray-700 bg-[#fdfefd] dark:bg-gray-700/60 rounded-2xl p-4 flex gap-3 items-start">
                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900 dark:text-white">{doc.title}</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold mt-1">No. {doc.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-300">Proprietor Name</label>
                  <input className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white w-full" value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-300">Store Name</label>
                  <input className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white w-full" value={profile.businessName || ''} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-300">Mobile Phone</label>
                  <input className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white w-full" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-300">GSTIN Registration</label>
                  <input className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white w-full" value={profile.gstNumber || ''} onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-300">Warehouse Address</label>
                  <textarea className="min-h-24 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 p-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white w-full" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-300">Shop Image</label>
                  <div className="flex items-center gap-4">
                    {profile.shopImage && (
                      <div className="h-16 w-16 relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <img src={profile.shopImage} alt="Shop" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    )}
                    <label className="flex h-12 items-center justify-center border border-gray-200 dark:border-gray-600 border-dashed rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-650 transition text-gray-500 dark:text-gray-300 flex-1">
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} disabled={saving} />
                      {profile.shopImage ? 'Change Image' : 'Upload Shop Image'}
                    </label>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="flex h-12 items-center rounded-xl justify-center gap-2 bg-[#2bb673] text-sm font-extrabold text-white disabled:opacity-70 sm:col-span-2 hover:bg-green-600 transition cursor-pointer">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile Details'}
                </button>
              </form>
            </section>
          )}

          {activeTab === 'settings' && (
            <section className="border border-[#e9f2eb] dark:border-gray-700 rounded-3xl bg-white dark:bg-gray-800 p-5 sm:p-8 space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-300">Configure delivery rules, shop hours, and bank accounts.</p>
              </div>

              <form onSubmit={saveSettings} className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Store Status (Open/Closed)</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Toggle whether customers can see your products as purchasable.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, storeOpen: !settingsForm.storeOpen })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settingsForm.storeOpen ? 'bg-[#2bb673]' : 'bg-gray-200 dark:bg-gray-600'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settingsForm.storeOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Minimum Order for Free Delivery (₹)</label>
                    <input className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white" value={settingsForm.minOrderFree} onChange={(e) => setSettingsForm({ ...settingsForm, minOrderFree: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Handling & Packaging Charge (₹)</label>
                    <input className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white" value={settingsForm.handlingCharge} onChange={(e) => setSettingsForm({ ...settingsForm, handlingCharge: e.target.value })} required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Open Hours</label>
                    <input type="time" className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white" value={settingsForm.openTime} onChange={(e) => setSettingsForm({ ...settingsForm, openTime: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Close Hours</label>
                    <input type="time" className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white" value={settingsForm.closeTime} onChange={(e) => setSettingsForm({ ...settingsForm, closeTime: e.target.value })} required />
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">Payout Destination Bank</h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white" placeholder="Bank Name" value={settingsForm.bankName} onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })} required />
                    <input className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white" placeholder="Account Number" value={settingsForm.bankAccNo} onChange={(e) => setSettingsForm({ ...settingsForm, bankAccNo: e.target.value })} required />
                    <input className="h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] dark:text-white" placeholder="IFSC Code" value={settingsForm.bankIfsc} onChange={(e) => setSettingsForm({ ...settingsForm, bankIfsc: e.target.value })} required />
                  </div>
                </div>

                <button type="submit" disabled={saving} className="flex h-12 items-center justify-center gap-2 bg-[#2bb673] text-sm font-extrabold text-white rounded-xl hover:bg-green-600 transition disabled:opacity-70 w-full cursor-pointer">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Settings'}
                </button>
              </form>
            </section>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navbar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#e9f2eb] px-4 py-1 flex justify-around items-center z-40">
        {[
          { id: 'home', label: 'Market', icon: BarChart3 },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'orders', label: 'Orders', icon: ReceiptText },
          { id: 'riders', label: 'Riders', icon: Bike },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { changeTab(tab.id); setShowMobileMore(false); }}
              className={`flex flex-col items-center justify-center flex-1 gap-1 transition ${isActive ? 'text-[#2bb673]' : 'text-[#5a6e62]'}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setShowMobileMore(!showMobileMore)}
          className={`flex flex-col items-center justify-center flex-1 gap-1 transition ${['notifications', 'profile', 'settings'].includes(activeTab) || showMobileMore ? 'text-[#2bb673]' : 'text-[#5a6e62]'}`}
        >
          <ChevronDown className={`h-5 w-5 transform transition-transform ${showMobileMore ? 'rotate-180' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-wider">More</span>
        </button>
      </div>

      {/* Mobile More Overlay Menu */}
      {showMobileMore && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-xs flex flex-col justify-end" onClick={() => setShowMobileMore(false)}>
          <div className="bg-white rounded-t-[2rem] p-6 space-y-4 animate-fadeIn max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-2 border-b border-[#f0f6f2]">
              <h3 className="font-extrabold text-sm text-gray-900 uppercase tracking-widest">More Options</h3>
              <button onClick={() => setShowMobileMore(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'add', label: 'Add Product', icon: PackagePlus },
                { id: 'customers', label: 'Customers', icon: User },
                { id: 'notifications', label: 'Notifications', icon: Bell },
                { id: 'profile', label: 'Profile', icon: Store },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'add') {
                        openAddProduct();
                      } else {
                        changeTab(tab.id);
                      }
                      setShowMobileMore(false);
                    }}
                    className="flex items-center gap-3 p-4 border border-[#e9f2eb] rounded-2xl bg-white hover:bg-[#f6faf7] transition text-left text-xs font-bold text-gray-700"
                  >
                    <Icon className="h-5 w-5 text-[#2bb673]" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => { signOut(); router.push('/vendor/login'); }}
              className="w-full py-4 text-center border border-red-100 bg-red-50 text-red-600 rounded-2xl text-xs font-black hover:bg-red-100 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      {/* Product Form Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-2xl border border-[#e9f2eb] dark:border-gray-700 relative animate-fadeIn max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 h-9 w-9 bg-[#f4f7f5] dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-black text-gray-950 dark:text-white mb-6">{editingId ? 'Edit Product' : 'Add Product'}</h2>

            <form onSubmit={saveProduct} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 relative">
                <input
                  className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="Product Name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />

                {matchingGlobalProducts.length > 0 && (
                  <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl space-y-2 relative z-20">
                    <p className="text-xs font-bold text-green-800 dark:text-green-300">Similar products found in master catalog. Click one to copy its details:</p>
                    <div className="flex flex-wrap gap-2">
                      {matchingGlobalProducts.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setProductForm({
                              ...productForm,
                              name: p.name || p.product_name || '',
                              description: p.description || p.product_description || '',
                              image: p.image || p.product_image || '',
                              categorySlug: p.categorySlug || (p.category || '').toLowerCase().replace(/\s+/g, '-'),
                            });
                            setMatchingGlobalProducts([]);
                          }}
                          className="bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-green-500 hover:text-green-700 transition cursor-pointer"
                        >
                          {p.name || p.product_name} ({p.category})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Category</label>
                <select
                  className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 cursor-pointer"
                  value={productForm.categorySlug}
                  onChange={(e) => setProductForm({ ...productForm, categorySlug: e.target.value })}
                  required
                >
                  {categories.map((category) => <option key={category._id} value={category.slug} className="text-gray-900 dark:text-white dark:bg-gray-800">{category.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Stock Quantity</label>
                <input
                  type="number"
                  className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="Stock"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Discount %</label>
                <input
                  type="number"
                  max="100"
                  min="0"
                  className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="Discount %"
                  value={productForm.discount}
                  onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Image URL</label>
                <input
                  className="w-full h-12 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 px-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="Image URL"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  required
                />
              </div>

              <div className="sm:col-span-2 p-3 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Enable Bulk / Wholesale Buying</p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300">Allow customers to negotiate custom bulk rates (Minimum 5 kg)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={productForm.is_bulk_available}
                    onChange={(e) => setProductForm({ ...productForm, is_bulk_available: e.target.checked })}
                    className="w-5 h-5 accent-[#2bb673] rounded cursor-pointer"
                  />
                </div>

                {productForm.is_bulk_available && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Min Bulk Qty (kg) *</label>
                      <input
                        type="number"
                        min="5"
                        value={productForm.bulk_min_qty}
                        onChange={(e) => setProductForm({ ...productForm, bulk_min_qty: e.target.value })}
                        className="w-full h-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 px-2 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400"
                        placeholder="5"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Wholesale Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.bulk_base_price}
                        onChange={(e) => setProductForm({ ...productForm, bulk_base_price: e.target.value })}
                        className="w-full h-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 px-2 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400"
                        placeholder="e.g. 40"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Bulk Unit</label>
                      <select
                        value={productForm.bulk_unit}
                        onChange={(e) => setProductForm({ ...productForm, bulk_unit: e.target.value })}
                        className="w-full h-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 px-2 text-xs font-semibold text-gray-900 dark:text-white cursor-pointer"
                      >
                        <option value="kg" className="text-gray-900 dark:text-white dark:bg-gray-800">kg</option>
                        <option value="crate" className="text-gray-900 dark:text-white dark:bg-gray-800">Crate</option>
                        <option value="box" className="text-gray-900 dark:text-white dark:bg-gray-800">Box</option>
                        <option value="quintal" className="text-gray-900 dark:text-white dark:bg-gray-800">Quintal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-700 dark:text-gray-300">Bulk Stock</label>
                      <input
                        type="number"
                        value={productForm.bulk_stock}
                        onChange={(e) => setProductForm({ ...productForm, bulk_stock: e.target.value })}
                        className="w-full h-10 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 px-2 text-xs font-semibold text-gray-900 dark:text-white placeholder:text-gray-400"
                        placeholder="500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  className="w-full min-h-24 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700 p-4 text-sm font-semibold outline-none focus:border-[#2bb673] text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700"
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3 sm:col-span-2 mt-2">
                <button type="button" onClick={closeModal} className="h-12 flex-1 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-extrabold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="flex h-12 flex-1 rounded-xl items-center justify-center gap-2 bg-[#2bb673] text-sm font-extrabold text-white hover:bg-green-600 transition disabled:opacity-70 cursor-pointer">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
