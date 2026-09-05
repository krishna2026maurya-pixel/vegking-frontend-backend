"use client";
import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, X, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
function CreateProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryVendorId = searchParams.get('vendor_id') || '';
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  // Multiple images state
  const [images, setImages] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState('');
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/category-types?limit=100`).then(r => r.json()).then(j => setCategoryTypes(j.data || []));
    fetch(`/api/categories?limit=200`).then(r => r.json()).then(j => setCategories(j.data || []));
    fetch(`/api/subcategories?limit=200`).then(r => r.json()).then(j => setSubcategories(j.data || []));
    fetch(`/api/vendors?limit=100`).then(r => r.json()).then(j => setVendors(j.data || []));
  }, []);

  const [form, setForm] = useState({
    vendor_id: queryVendorId,
    product_name: '',
    cat_type_id: '',
    category: '',
    subcategory: '',
    low_category: '',
    brand: '',
    product_label: '',
    quantity: '',
    volume: '',
    mrp: '',
    selling_price: '',
    gst: '0',
    total_amt: '',
    product_description: '',
    add_info_title: '',
    add_info_desc: '',
    stock: '25',
    stock_status: '1',
    description: '',
    // Bulk selling fields
    is_bulk_available: false,
    bulk_min_qty: '5',
    bulk_base_price: '',
    bulk_unit: 'kg',
    bulk_stock: '',
  });

  // Sync vendor_id if query param changes
  useEffect(() => {
    if (queryVendorId) {
      setForm(prev => ({ ...prev, vendor_id: queryVendorId }));
    }
  }, [queryVendorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target;
    if (target.type === 'checkbox') {
      const checked = (target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, [target.name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [target.name]: target.value }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImg(true);
    setError('');

    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('file', files[i]);
      }

      const res = await fetch(`/api/upload`, { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      // The API always returns a 'urls' array which is the most reliable
      const newUrls = json.urls || (Array.isArray(json.data) ? json.data.map((item: any) => item.url) : [json.data?.url]);

      if (newUrls && newUrls.length > 0) {
        setImages(prev => {
          const updated = [...prev, ...newUrls.filter((u: any) => u)];
          if (!mainImage && updated.length > 0) setMainImage(updated[0]);
          return updated;
        });
      }
    } catch (e: any) {
      setError('Image upload failed: ' + e.message);
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const removedUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);

    // If removed was main, set new main
    if (mainImage === removedUrl) {
      setMainImage(newImages.length > 0 ? newImages[0] : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length === 0) {
      setError('Please upload at least one image.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vendor_id: form.vendor_id || null,
          images: images,
          product_image: mainImage || images[0],
          product_images: JSON.stringify(images),
          mrp: Number(form.mrp) || 0,
          selling_price: Number(form.selling_price) || 0,
          gst: Number(form.gst) || 0,
          total_amt: Number(form.total_amt) || 0,
          stock: form.stock !== '' && !isNaN(Number(form.stock)) ? Number(form.stock) : 25,
          stock_status: form.stock_status !== '' && !isNaN(Number(form.stock_status)) ? Number(form.stock_status) : 1,
          // Bulk fields
          is_bulk_available: form.is_bulk_available,
          bulk_min_qty: Math.max(5, Number(form.bulk_min_qty) || 5),
          bulk_base_price: form.bulk_base_price !== '' ? Number(form.bulk_base_price) : Number(form.selling_price) || 0,
          bulk_unit: form.bulk_unit || 'kg',
          bulk_stock: form.bulk_stock !== '' ? Number(form.bulk_stock) : 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push('/admin/products');
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const sectionCls = "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" /></button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Product</h1>
          <p className="text-sm text-gray-500">Add a new product to the catalog</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Product Image Section */}
        <div className={sectionCls}>
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Product Images</h2>
            <span className="text-xs text-gray-500">First image will be default front image. You can click on any image to set it as front.</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, idx) => (
              <div key={idx} className={`relative group border-2 rounded-xl overflow-hidden aspect-square ${mainImage === url ? 'border-green-500 shadow-md' : 'border-gray-200 dark:border-gray-700'}`}>
                <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover cursor-pointer" onClick={() => setMainImage(url)} />

                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>

                {mainImage === url && (
                  <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> Front
                  </div>
                )}

                {mainImage !== url && (
                  <button type="button" onClick={() => setMainImage(url)} className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 text-[10px] px-2 py-0.5 rounded-full border opacity-0 group-hover:opacity-100 transition-opacity">Set Front</button>
                )}
              </div>
            ))}

            <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center aspect-square cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors">
              {uploadingImg ? (
                <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Upload size={24} className="text-gray-400" />
                  <p className="text-[10px] text-gray-500 mt-1 text-center px-2">Click to add images</p>
                </>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
        </div>

        {/* Basic Info Section */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Product Name *</label><input name="product_name" value={form.product_name} onChange={handleChange} required className={inputCls} /></div>
            {!queryVendorId && (
              <div>
                <label className={labelCls}>Vendor</label>
                <select name="vendor_id" value={form.vendor_id} onChange={handleChange} className={inputCls}>
                  <option value="">Select Vendor...</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.shop_name}</option>)}
                </select>
              </div>
            )}
            <div><label className={labelCls}>Brand</label><input name="brand" value={form.brand} onChange={handleChange} className={inputCls} /></div>
            <div><label className={labelCls}>Product Label</label><input name="product_label" value={form.product_label} onChange={handleChange} placeholder="e.g. Inclusive of all taxes" className={inputCls} /></div>
          </div>
        </div>

        {/* Categories Section */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Categorization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category Type</label>
              <select name="cat_type_id" value={form.cat_type_id} onChange={handleChange} className={inputCls}>
                <option value="">Select Category Type...</option>
                {categoryTypes.map(ct => <option key={ct._id} value={ct._id}>{ct.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                <option value="">Select Category...</option>
                {categories.map(c => <option key={c._id} value={c.name || c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subcategory</label>
              <select name="subcategory" value={form.subcategory} onChange={handleChange} className={inputCls}>
                <option value="">Select Subcategory...</option>
                {subcategories.map(s => <option key={s._id} value={s.category_name || s.name || s._id}>{s.category_name || s.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Low Category</label><input name="low_category" value={form.low_category} onChange={handleChange} className={inputCls} /></div>
          </div>
        </div>

        {/* Pricing & Volume Section */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Pricing, Quantity & Volume</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className={labelCls}>Quantity (Pack)</label><input name="quantity" value={form.quantity} onChange={handleChange} placeholder="e.g. 1" className={inputCls} /></div>
            <div><label className={labelCls}>Volume / Unit</label><input name="volume" value={form.volume} onChange={handleChange} placeholder="e.g. kg, liter" className={inputCls} /></div>
            <div>
              <label className={labelCls}>Stock (Units in DB) *</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="e.g. 25" required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Stock Status</label>
              <select name="stock_status" value={form.stock_status} onChange={handleChange} className={inputCls}>
                <option value="1">In Stock</option>
                <option value="0">Out of Stock</option>
              </select>
            </div>
            <div><label className={labelCls}>MRP (₹)</label><input name="mrp" type="number" step="0.01" value={form.mrp} onChange={handleChange} className={inputCls} /></div>
            <div><label className={labelCls}>Selling Price (₹)</label><input name="selling_price" type="number" step="0.01" value={form.selling_price} onChange={handleChange} className={inputCls} /></div>
            <div>
              <label className={labelCls}>GST (%)</label>
              <select name="gst" value={form.gst} onChange={handleChange} className={inputCls}>
                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
              </select>
            </div>
            <div><label className={labelCls}>Total Amount (Internal Use)</label><input name="total_amt" type="number" step="0.01" value={form.total_amt} onChange={handleChange} className={inputCls} /></div>
          </div>
        </div>

        {/* Bulk Selling & Negotiation Settings Section */}
        <div className={sectionCls}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Bulk Selling & Negotiation Settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Enable customers to negotiate rate & weight in bulk (Minimum 5 kg)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="is_bulk_available" checked={form.is_bulk_available} onChange={handleChange} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {form.is_bulk_available && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div>
                <label className={labelCls}>Min Bulk Qty (Min 5 kg) *</label>
                <input name="bulk_min_qty" type="number" min="5" step="1" value={form.bulk_min_qty} onChange={handleChange} placeholder="5" required className={inputCls} />
                <span className="text-[11px] text-gray-400">Must be at least 5 kg</span>
              </div>
              <div>
                <label className={labelCls}>Wholesale Base Price (₹/unit)</label>
                <input name="bulk_base_price" type="number" step="0.01" value={form.bulk_base_price} onChange={handleChange} placeholder={form.selling_price || "e.g. 40"} className={inputCls} />
                <span className="text-[11px] text-gray-400">Starting wholesale price</span>
              </div>
              <div>
                <label className={labelCls}>Bulk Unit</label>
                <select name="bulk_unit" value={form.bulk_unit} onChange={handleChange} className={inputCls}>
                  <option value="kg">kg</option>
                  <option value="crate">Crate</option>
                  <option value="box">Box</option>
                  <option value="quintal">Quintal</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Bulk Stock Available</label>
                <input name="bulk_stock" type="number" value={form.bulk_stock} onChange={handleChange} placeholder="e.g. 500" className={inputCls} />
                <span className="text-[11px] text-gray-400">Total bulk inventory</span>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info Section */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Descriptions & Additional Info</h2>
          <div className="space-y-4">
            <div><label className={labelCls}>Main Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={2} className={inputCls} /></div>
            <div><label className={labelCls}>Product Description (Short)</label><textarea name="product_description" value={form.product_description} onChange={handleChange} rows={2} className={inputCls} /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelCls}>Additional Info Title</label><input name="add_info_title" value={form.add_info_title} onChange={handleChange} className={inputCls} /></div>
              <div><label className={labelCls}>Additional Info Description</label><textarea name="add_info_desc" value={form.add_info_desc} onChange={handleChange} rows={1} className={inputCls} /></div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/admin/products"><button type="button" className="px-5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button></Link>
          <button type="submit" disabled={saving || uploadingImg} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"><Save size={16} />{saving ? 'Saving...' : 'Save Product'}</button>
        </div>
      </form>
    </div>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CreateProductForm />
    </Suspense>
  );
}
