'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, MapPin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Address {
  _id?: string;
  label: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  is_default: boolean;
}

export function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Address>({
    label: 'Home',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    latitude: 28.6139,
    longitude: 77.2090,
    is_default: false
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/addresses?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setFormData({
      label: 'Home',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      latitude: 28.6139,
      longitude: 77.2090,
      is_default: false
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (addr: Address) => {
    setFormData({ ...addr });
    setEditingId(addr._id || null);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, _id: editingId } : formData;
      
      const res = await fetch('/api/user/addresses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
        setIsFormOpen(false);
      }
    } catch (err) {
      console.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error('Delete failed');
    }
  };

  if (loading) {
    return <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>;
  }

  if (isFormOpen) {
    return (
      <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-green-600" />
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button
            type="button"
            onClick={() => setIsFormOpen(false)}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-gray-700">Address Label (e.g., Home, Work)</label>
              <Input 
                value={formData.label} 
                onChange={e => setFormData({ ...formData, label: e.target.value })} 
                required 
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-gray-700">Street Address</label>
              <Input 
                value={formData.address_line_1} 
                onChange={e => setFormData({ ...formData, address_line_1: e.target.value })} 
                placeholder="House No, Building, Street" 
                required 
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold text-gray-700">Locality / Landmark</label>
              <Input 
                value={formData.address_line_2} 
                onChange={e => setFormData({ ...formData, address_line_2: e.target.value })} 
                placeholder="Nearby landmark" 
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">City</label>
              <Input 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
                required 
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">State</label>
              <Input 
                value={formData.state} 
                onChange={e => setFormData({ ...formData, state: e.target.value })} 
                required 
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-gray-700">ZIP Code</label>
              <Input 
                value={formData.zip_code} 
                onChange={e => setFormData({ ...formData, zip_code: e.target.value })} 
                required 
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="flex items-center sm:mt-5">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="is_default" className="ml-2 block text-xs font-bold text-gray-700 cursor-pointer">
                Set as Default Address
              </label>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="w-full h-9 font-bold text-xs rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="w-full h-9 font-extrabold text-xs bg-green-600 hover:bg-green-700 rounded-xl">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Save Address
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
        <div>
          <h2 className="text-sm sm:text-base font-black text-gray-950 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-green-600" />
            Saved Addresses
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Manage your delivery locations</p>
        </div>
        <Button onClick={openAddForm} className="bg-green-600 hover:bg-green-700 font-bold text-xs h-8 px-3 rounded-lg shadow-xs cursor-pointer">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl p-4 space-y-1.5">
          <MapPin className="mx-auto h-8 w-8 text-gray-300 mb-1" />
          <p className="text-xs font-bold text-gray-600">No addresses saved yet.</p>
          <p className="text-[11px] text-gray-400">Add an address for quick checkouts.</p>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {addresses.map((addr, index) => (
            <div key={addr._id || index} className="relative rounded-xl border border-gray-200/90 p-3 sm:p-3.5 transition hover:border-green-300 hover:shadow-2xs space-y-1.5 bg-white">
              {addr.is_default && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-0.5 rounded bg-green-100 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-green-700 border border-green-200/60">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Default
                </span>
              )}
              <h3 className="font-black text-xs sm:text-sm text-gray-950 flex items-center gap-1.5">
                {addr.label}
              </h3>
              <p className="text-xs text-gray-600 font-medium leading-snug">
                {addr.address_line_1}
                {addr.address_line_2 && <><br />{addr.address_line_2}</>}
                <br />
                {addr.city}, {addr.state} {addr.zip_code}
              </p>
              
              <div className="pt-1 flex gap-1.5">
                <button 
                  onClick={() => openEditForm(addr)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 hover:text-green-800 bg-green-50 border border-green-200/60 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Edit2 className="h-3 w-3" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(addr._id!)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 border border-red-200/60 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
