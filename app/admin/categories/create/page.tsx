"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateCategoryPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', sort_order: '1', is_active: '1', cat_type_id: '' });
  const [categoryTypes, setCategoryTypes] = useState<any[]>([]);

  React.useEffect(() => {
    fetch(`/api/category-types?limit=100`).then(res => res.json()).then(json => {
      setCategoryTypes(json.data || []);
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    const updates: any = { [e.target.name]: val };
    if (e.target.name === 'name') updates.slug = val.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-');
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadingImg(true);
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch(`/api/upload`, { method: 'POST', body: fd });
    const json = await res.json();
    setImageUrl(json.url);
    setUploadingImg(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`/api/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, image: imageUrl, sort_order: Number(form.sort_order) }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push('/admin/categories');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/categories"><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" /></button></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Category</h1><p className="text-sm text-gray-500">नई category जोड़ें</p></div>
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Category Image</h2>
          <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors">
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg mx-auto" />
                {uploadingImg && <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageUrl(null); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
              </div>
            ) : (
              <div className="space-y-2"><Upload size={28} className="mx-auto text-gray-400" /><p className="text-sm text-gray-500">Click to upload category image</p></div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Category Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Type</label>
            <select name="cat_type_id" value={form.cat_type_id} onChange={handleChange} className={inputCls}>
              <option value="">Select Category Type...</option>
              {categoryTypes.map(ct => (
                <option key={ct._id} value={ct._id}>{ct.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Vegetables"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} placeholder="auto-generated"
              className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
              <input name="sort_order" type="number" min="1" value={form.sort_order} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select name="is_active" value={form.is_active} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="1">Active</option><option value="0">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pb-6">
          <Link href="/admin/categories"><button type="button" className="px-5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button></Link>
          <button type="submit" disabled={saving || uploadingImg} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium shadow-sm">
            <Save size={16} />{saving ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </form>
    </div>
  );
}
