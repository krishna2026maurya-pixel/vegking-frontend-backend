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
    return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>;
  }

  if (isFormOpen) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-black text-gray-950">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-700">Address Label (e.g., Home, Work)</label>
              <Input 
                value={formData.label} 
                onChange={e => setFormData({ ...formData, label: e.target.value })} 
                required 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-700">Street Address</label>
              <Input 
                value={formData.address_line_1} 
                onChange={e => setFormData({ ...formData, address_line_1: e.target.value })} 
                placeholder="House No, Building, Street" 
                required 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-bold text-gray-700">Locality / Landmark</label>
              <Input 
                value={formData.address_line_2} 
                onChange={e => setFormData({ ...formData, address_line_2: e.target.value })} 
                placeholder="Nearby landmark" 
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">City</label>
              <Input 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">State</label>
              <Input 
                value={formData.state} 
                onChange={e => setFormData({ ...formData, state: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-gray-700">ZIP Code</label>
              <Input 
                value={formData.zip_code} 
                onChange={e => setFormData({ ...formData, zip_code: e.target.value })} 
                required 
              />
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="is_default"
                checked={formData.is_default}
                onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="is_default" className="ml-2 block text-sm font-bold text-gray-700">
                Set as Default Address
              </label>
            </div>
          </div>



          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="w-full h-11 font-bold">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="w-full h-11 font-extrabold bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Address
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-950">Saved Addresses</h2>
        <Button onClick={openAddForm} className="bg-green-600 hover:bg-green-700 font-bold text-xs h-9">
          <Plus className="h-4 w-4 mr-1" /> Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
          <MapPin className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-500">No addresses saved yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr, index) => (
            <div key={addr._id || index} className="relative rounded-xl border border-gray-200 p-4 transition hover:border-green-300 hover:shadow-md hover:shadow-green-50">
              {addr.is_default && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
                  <CheckCircle2 className="h-3 w-3" /> Default
                </span>
              )}
              <h3 className="font-black text-gray-950 flex items-center gap-2">
                {addr.label}
              </h3>
              <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">
                {addr.address_line_1}
                {addr.address_line_2 && <><br />{addr.address_line_2}</>}
                <br />
                {addr.city}, {addr.state} {addr.zip_code}
              </p>
              
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => openEditForm(addr)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(addr._id!)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
