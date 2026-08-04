"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, X, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditSubcategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', sort_order: '', is_active: '1', category_id: '' });
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/categories?limit=200`).then(r => r.json()).then(j => setCategories(j.data || []));
  }, []);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/subcategories/${id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (json.data) {
          setForm({
            name: json.data.name || '',
            slug: json.data.slug || '',
            sort_order: json.data.sort_order?.toString() || '',
            is_active: json.data.is_active || '1',
            category_id: json.data.category_id || '',
          });
          if (json.data.image) {
            setImageUrl(json.data.image);
            setImagePreview(json.data.image);
          }
        }
      } catch (e: any) { setError(e.message); } finally { setLoading(false); }
    };
    load();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setUploadingImg(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/upload`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setImageUrl(json.url);
    } catch (e: any) { setError('Image upload failed: ' + e.message); }
    finally { setUploadingImg(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const res = await fetch(`/api/subcategories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sort_order: Number(form.sort_order), image: imageUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      router.push('/admin/subcategories');
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500";

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/subcategories"><button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" /></button></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Subcategory</h1></div>
      </div>
      {error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">⚠️ {error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">Subcategory Image</h2>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition-colors">
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="h-40 w-40 object-cover rounded-lg mx-auto" />
                {uploadingImg && <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageUrl(null); }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X size={12} /></button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={32} className="mx-auto text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload image</p>
                <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 5MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Subcategory Info</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Tomato" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
            <input name="slug" value={form.slug} onChange={handleChange} placeholder="e.g. tomato" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Parent Category</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className={inputCls}>
              <option value="">Select Category...</option>
              {categories.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
            <input name="sort_order" type="number" value={form.sort_order} onChange={handleChange} placeholder="e.g. 1" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select name="is_active" value={form.is_active} onChange={handleChange} className={inputCls}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 pb-6">
          <Link href="/admin/subcategories"><button type="button" className="px-5 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button></Link>
          <button type="submit" disabled={saving || uploadingImg} className="flex items-center gap-2 px-6 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium shadow-sm"><Save size={16} />{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
}
