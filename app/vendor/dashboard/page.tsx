'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BarChart3, Loader2, LogOut, Package, PackagePlus, ReceiptText, Store, User, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const tabs = [
  { id: 'home', label: 'Dashboard Home', icon: BarChart3 },
  { id: 'add', label: 'Add Product', icon: PackagePlus },
  { id: 'products', label: 'My Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ReceiptText },
  { id: 'profile', label: 'Profile', icon: User },
];

const emptyProduct = {
  name: '',
  price: '',
  discount: '0',
  stock: '50',
  description: '',
  image: '',
  categorySlug: '',
  weightOptions: [] as Array<{ weight: string; price: string }>,
};

export default function VendorDashboardPage() {
  const { data: session, signOut } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const stats = useMemo(() => {
    const orderItems = orders.flatMap((order) => order.items || []);
    return {
      products: products.length,
      orders: orders.length,
      stock: products.reduce((sum, product) => sum + Number(product.stock || 0), 0),
      revenue: orderItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    };
  }, [orders, products]);

  const loadVendorData = useCallback(async () => {
    setLoading(true);
    try {
      // DUMMY API CALL: Simulate data fetching
      await new Promise(r => setTimeout(r, 1000));
      
      const dummyProducts = [
        { _id: 'p1', name: 'Organic Tomatoes', category: 'Vegetables', price: 40, stock: 150, image: '/images/categories/vegetables.jpg' }
      ];
      const dummyCategories = [{ _id: '1', slug: 'vegetables', name: 'Vegetables', isActive: true }];
      const dummyProfile = { businessName: 'Fresh Farms Ltd', name: 'John Doe', phone: '1234567890', address: '123 Farm Road', gstNumber: 'GST123' };

      setProducts(dummyProducts);
      setOrders([]);
      setCategories(dummyCategories);
      setProfile(dummyProfile);
      setProductForm((current) => ({ ...current, categorySlug: current.categorySlug || dummyCategories[0]?.slug || '' }));
    } catch {
      setMessage('Unable to load vendor dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Basic auth check simulation
    if (!session?.user) {
      router.push('/vendor/login');
      return;
    }
    if (session.user.role !== 'vendor' && session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    loadVendorData();
  }, [loadVendorData, router, session]);

  const resetProductForm = () => {
    setEditingId(null);
    setProductForm({ ...emptyProduct, categorySlug: categories[0]?.slug || '' });
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await new Promise(r => setTimeout(r, 1000)); // Simulate save
      
      resetProductForm();
      setActiveTab('products');
      await loadVendorData();
    } catch {
      setMessage('Unable to save product.');
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
    });
    setActiveTab('add');
  };

  const deleteProduct = async (product: any) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setProducts((current) => current.filter((item) => item._id !== product._id));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    await new Promise(r => setTimeout(r, 1000)); // Simulate save
    setMessage('Profile updated successfully (dummy).');
    setSaving(false);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-bold text-gray-500">Loading vendor dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f6faf5]">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-6 px-4 py-8 lg:flex-row lg:px-8">
        <aside className="w-full border border-gray-100 bg-white p-4 shadow-sm lg:w-72 rounded-2xl h-fit">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center bg-green-50 text-green-700 rounded-full">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-gray-950">{profile?.businessName || session?.user?.name}</p>
              <p className="text-xs font-bold uppercase tracking-wide text-green-700">Approved Vendor</p>
            </div>
          </div>
          <nav className="mt-4 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-extrabold transition ${activeTab === tab.id ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={() => { signOut(); router.push('/vendor/login'); }} className="mt-4 flex w-full items-center gap-3 border-t border-gray-100 px-3 py-4 text-sm font-extrabold text-red-600 hover:bg-red-50 rounded-xl transition">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </aside>

        <main className="min-w-0 flex-1">
          {message && <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">{message}</div>}

          {activeTab === 'home' && (
            <section className="space-y-6">
              <div>
                <h1 className="text-3xl font-black text-gray-950">Vendor Dashboard</h1>
                <p className="mt-2 text-sm font-medium text-gray-500">Manage listings, stock, orders, and profile details.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Products', stats.products],
                  ['Orders', stats.orders],
                  ['Stock Units', stats.stock],
                  ['Revenue', `Rs. ${stats.revenue.toFixed(0)}`],
                ].map(([label, value]) => (
                  <div key={label} className="border border-gray-100 rounded-2xl bg-white p-6 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">{label}</p>
                    <p className="mt-3 text-3xl font-black text-gray-950">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'add' && (
            <section className="border border-gray-100 rounded-2xl bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-black text-gray-950">{editingId ? 'Edit Product' : 'Add Product'}</h1>
              <form onSubmit={saveProduct} className="mt-6 grid gap-4 sm:grid-cols-2">
                <input className="h-12 border border-gray-200 rounded-xl bg-gray-50 px-4 text-sm font-semibold outline-none focus:border-green-500 sm:col-span-2" placeholder="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
                <input type="number" step="0.01" className="h-12 border border-gray-200 rounded-xl bg-gray-50 px-4 text-sm font-semibold outline-none focus:border-green-500" placeholder="Price" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
                <select className="h-12 border border-gray-200 rounded-xl bg-gray-50 px-4 text-sm font-semibold outline-none focus:border-green-500" value={productForm.categorySlug} onChange={(e) => setProductForm({ ...productForm, categorySlug: e.target.value })} required>
                  {categories.map((category) => <option key={category._id} value={category.slug}>{category.name}</option>)}
                </select>
                <input type="number" className="h-12 border border-gray-200 rounded-xl bg-gray-50 px-4 text-sm font-semibold outline-none focus:border-green-500" placeholder="Stock" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
                <input type="number" max="100" min="0" className="h-12 border border-gray-200 rounded-xl bg-gray-50 px-4 text-sm font-semibold outline-none focus:border-green-500" placeholder="Discount %" value={productForm.discount} onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })} />
                <input className="h-12 border border-gray-200 rounded-xl bg-gray-50 px-4 text-sm font-semibold outline-none focus:border-green-500 sm:col-span-2" placeholder="Image URL" value={productForm.image} onChange={(e) => setProductForm({ ...productForm, image: e.target.value })} required />
                <textarea className="min-h-28 border border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-semibold outline-none focus:border-green-500 sm:col-span-2" placeholder="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} required />
                
                <div className="border border-dashed rounded-xl border-green-200 bg-green-50/50 p-4 sm:col-span-2">
                  <p className="text-xs font-black uppercase tracking-widest text-green-700">Weight Options</p>
                  <div className="mt-3 space-y-2">
                    {productForm.weightOptions.map((option, index) => (
                      <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <input className="h-10 border border-gray-200 rounded-lg bg-white px-3 text-sm font-semibold outline-none" placeholder="500g" value={option.weight} onChange={(e) => {
                          const next = [...productForm.weightOptions];
                          next[index].weight = e.target.value;
                          setProductForm({ ...productForm, weightOptions: next });
                        }} />
                        <input type="number" step="0.01" className="h-10 border border-gray-200 rounded-lg bg-white px-3 text-sm font-semibold outline-none" placeholder="Price" value={option.price} onChange={(e) => {
                          const next = [...productForm.weightOptions];
                          next[index].price = e.target.value;
                          setProductForm({ ...productForm, weightOptions: next });
                        }} />
                        <button type="button" className="inline-flex h-10 items-center justify-center rounded-lg bg-red-50 px-3 text-red-600 hover:bg-red-100 transition" onClick={() => setProductForm({ ...productForm, weightOptions: productForm.weightOptions.filter((_, itemIndex) => itemIndex !== index) })}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" className="mt-3 text-sm font-black text-green-700 hover:underline" onClick={() => setProductForm({ ...productForm, weightOptions: [...productForm.weightOptions, { weight: '', price: '' }] })}>Add Weight Option</button>
                </div>
                <div className="flex gap-3 sm:col-span-2">
                  {editingId && <button type="button" onClick={resetProductForm} className="h-12 flex-1 rounded-xl border border-gray-200 text-sm font-extrabold text-gray-600 hover:bg-gray-50 transition">Cancel Edit</button>}
                  <button type="submit" disabled={saving} className="flex h-12 flex-1 rounded-xl items-center justify-center gap-2 bg-green-600 text-sm font-extrabold text-white hover:bg-green-700 transition disabled:opacity-70">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'products' && (
            <section className="border border-gray-100 rounded-2xl bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-black text-gray-950">My Products</h1>
              <div className="mt-5 grid gap-4">
                {products.map((product) => (
                  <div key={product._id} className="grid gap-4 rounded-xl border border-gray-100 p-4 sm:grid-cols-[80px_1fr_auto] sm:items-center">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100">
                      <Image src={product.image || '/images/product-card-default.jpg'} alt={product.name} fill sizes="80px" className="object-cover" />
                    </div>
                    <div>
                      <h2 className="font-black text-gray-950">{product.name}</h2>
                      <p className="mt-1 text-sm font-semibold text-gray-500">{product.category} - Rs. {Number(product.price).toFixed(2)} - {product.stock} in stock</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editProduct(product)} className="bg-gray-50 rounded-lg px-4 py-2 text-sm font-black text-gray-700 hover:bg-gray-100 transition">Edit</button>
                      <button type="button" onClick={() => deleteProduct(product)} className="bg-red-50 rounded-lg px-4 py-2 text-sm font-black text-red-600 hover:bg-red-100 transition">Delete</button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && <p className="py-10 text-center text-sm font-bold text-gray-500">No products added yet.</p>}
              </div>
            </section>
          )}

          {activeTab === 'orders' && (
            <section className="border border-gray-100 rounded-2xl bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-black text-gray-950">Orders</h1>
              <div className="mt-5 space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-black text-gray-950">Order #{order._id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs font-black uppercase tracking-wide text-green-700">{order.status}</p>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-500">{order.userId?.name || 'Customer'} - {new Date(order.createdAt).toLocaleString()}</p>
                    <div className="mt-3 space-y-2">
                      {order.items.map((item: any) => (
                        <div key={`${order._id}-${item.productId}`} className="flex justify-between gap-3 text-sm">
                          <span className="font-bold text-gray-700">{item.name} x {item.quantity}</span>
                          <span className="font-black text-gray-950">Rs. {(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {orders.length === 0 && <p className="py-10 text-center text-sm font-bold text-gray-500">No vendor orders yet.</p>}
              </div>
            </section>
          )}

          {activeTab === 'profile' && profile && (
            <section className="border border-gray-100 rounded-2xl bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-black text-gray-950">Profile</h1>
              <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
                {['name', 'businessName', 'phone', 'gstNumber'].map((field) => (
                  <input key={field} className="h-12 border border-gray-200 rounded-xl bg-gray-50 px-4 text-sm font-semibold outline-none focus:border-green-500" value={profile[field] || ''} onChange={(e) => setProfile({ ...profile, [field]: e.target.value })} placeholder={field} />
                ))}
                <textarea className="min-h-28 border border-gray-200 rounded-xl bg-gray-50 p-4 text-sm font-semibold outline-none focus:border-green-500 sm:col-span-2" value={profile.address || ''} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Address" />
                <button type="submit" disabled={saving} className="flex h-12 items-center rounded-xl justify-center gap-2 bg-green-600 text-sm font-extrabold text-white disabled:opacity-70 sm:col-span-2 hover:bg-green-700 transition">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Profile'}
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
