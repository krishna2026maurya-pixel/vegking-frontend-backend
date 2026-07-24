"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, X, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
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
    vendor_id: '',
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
    stock_status: '',
    description: '',
  });

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (json.data) {
          const d = json.data;
          setForm({
            vendor_id: d.vendor_id || '',
            product_name: d.product_name || '',
            cat_type_id: d.cat_type_id?.toString() || '',
            category: d.category || '',
            subcategory: d.subcategory || '',
            low_category: d.low_category || '',
            brand: d.brand || '',
            product_label: d.product_label || '',
            quantity: d.quantity || '',
            volume: d.volume || '',
            mrp: d.mrp?.toString() || '',
            selling_price: d.selling_price?.toString() || '',
            gst: d.gst?.toString() || '0',
            total_amt: d.total_amt?.toString() || '',
            product_description: d.product_description || '',
            add_info_title: d.add_info_title || '',
            add_info_desc: d.add_info_desc || '',
            stock_status: d.stock_status || '',
            description: d.description || '',
          });

          // Parse multiple images
          let loadedImages: string[] = [];
          if (Array.isArray(d.images)) {
            loadedImages = d.images;
          } else if (d.product_images) {
            try {
              loadedImages = JSON.parse(d.product_images);
              if (!Array.isArray(loadedImages)) loadedImages = [d.product_images];
            } catch {
              loadedImages = [d.product_images];
            }
          }

          setImages(loadedImages);
          setMainImage(d.product_image || (loadedImages.length > 0 ? loadedImages[0] : null));
        }
      } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImg(true);
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) {
        fd.append('file', files[i]);
      }

      const res = await fetch(`/api/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const newUrls = Array.isArray(json.data) ? json.data.map((item: any) => item.url) : [json.url];

      setImages(prev => {
        const updated = [...prev, ...newUrls];
        if (!mainImage && updated.length > 0) setMainImage(updated[0]);
        return updated;
      });
    } catch (e: any) { setError('Image upload failed: ' + e.message); }
    finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const removedUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (mainImage === removedUrl) {
      setMainImage(newImages.length > 0 ? newImages[0] : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          images: images,
          product_image: mainImage || (images.length > 0 ? images[0] : null),
          product_images: JSON.stringify(images),
          mrp: Number(form.mrp),
          selling_price: Number(form.selling_price),
          gst: Number(form.gst),
          total_amt: Number(form.total_amt) || 0,
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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" /></button>
        </Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Product</h1></div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Product Image Section */}
        <div className={sectionCls}>
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Product Images</h2>
            <span className="text-xs text-gray-500">Click on an image to set it as front.</span>
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
            <div>
              <label className={labelCls}>Vendor *</label>
              <select name="vendor_id" value={form.vendor_id} onChange={handleChange} required className={inputCls}>
                <option value="">Select Vendor...</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.shop_name}</option>)}
              </select>
            </div>
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
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Subcategory</label>
              <select name="subcategory" value={form.subcategory} onChange={handleChange} className={inputCls}>
                <option value="">Select Subcategory...</option>
                {subcategories.map(s => <option key={s._id} value={s._id}>{s.category_name || s.name}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Low Category</label><input name="low_category" value={form.low_category} onChange={handleChange} className={inputCls} /></div>
          </div>
        </div>

        {/* Pricing & Volume Section */}
        <div className={sectionCls}>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Pricing, Quantity & Volume</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className={labelCls}>Quantity</label><input name="quantity" value={form.quantity} onChange={handleChange} placeholder="e.g. 1" className={inputCls} /></div>
            <div><label className={labelCls}>Volume</label><input name="volume" value={form.volume} onChange={handleChange} placeholder="e.g. kg, liter" className={inputCls} /></div>
            <div><label className={labelCls}>Stock Status</label><input name="stock_status" value={form.stock_status} onChange={handleChange} placeholder="e.g. 50" className={inputCls} /></div>
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
          <button type="submit" disabled={saving || uploadingImg} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"><Save size={16} />{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
