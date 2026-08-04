"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateBannerPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    link: '',
    category_id: '',
    sort_order: 0,
    is_active: '1',
    image: '',
  });

  const [categories, setCategories] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/api/categories?limit=100`)
      .then(res => res.json())
      .then(json => setCategories(json.data || []))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch(`/api/upload`, { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      // Support the corrected API response structure
      const imageUrl = json.urls?.[0] || json.data?.url || json.url;
      setForm(prev => ({ ...prev, image: imageUrl }));
    } catch (e: any) {
      setError('Image upload failed: ' + e.message);
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) {
      setError('Please upload a banner image.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/banners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order)
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      router.push('/admin/banner-list');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/banner-list">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Banner</h1>
          <p className="text-sm text-gray-500">Add a new homepage banner</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Image */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Banner Image</h2>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-colors"
          >
            {form.image ? (
              <div className="relative inline-block w-full">
                <img src={form.image} alt="Preview" className="w-full h-48 object-cover rounded-lg mx-auto" />
                {uploadingImg && (
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, image: '' })); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="py-4 space-y-2">
                <Upload size={32} className="mx-auto text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload banner image</p>
                <p className="text-xs text-gray-400">Recommended size: 1200x400 (PNG, JPG)</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        {/* Banner Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div>
            <label className={labelCls}>Banner Title (Optional)</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Summer Sale 2026" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Connect to Category (Click Action)</label>
              <select name="category_id" value={form.category_id} onChange={handleChange} className={inputCls}>
                <option value="">No Category Link</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1">If selected, clicking the banner will open this category.</p>
            </div>

            <div>
              <label className={labelCls}>Custom Link (Alternative)</label>
              <input name="link" value={form.link} onChange={handleChange} placeholder="e.g. /offers" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sort Order</label>
              <input type="number" name="sort_order" value={form.sort_order} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select name="is_active" value={form.is_active} onChange={handleChange} className={inputCls}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="/admin/banner-list">
            <button type="button" className="px-5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
          </Link>
          <button type="submit" disabled={saving || uploadingImg}
            className="flex items-center gap-2 px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium shadow-sm">
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Banner'}
          </button>
        </div>
      </form>
    </div>
  );
}
