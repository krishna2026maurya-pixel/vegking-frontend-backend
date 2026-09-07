"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';
import { FormSection, FullSpan, TextInput, Textarea, Select, Toggle, FileUpload } from '../../components/FormComponents';

const initialState = {
  full_name: '',
  email: '',
  mobile_number: '',
  password: '',
  shop_name: '',
  shop_category: '',
  business_type: '',
  services_coverage: '',
  shop_image: '',
  gst_number: '',
  pan_number: '',
  licence_number: '',
  gst_certificate: '',
  pan_card: '',
  aadhar_front: '',
  aadhar_back: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  landmark: '',
  gps_lat: '',
  gps_long: '',
  gps_location: '',
  is_verified: false,
  is_bestseller: false,
  wallet_balance: '0.00',
  handling_charge: '0',
  fiberbase_token: '',
};

export default function CreateVendorPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([
    { value: 'Vegetables', label: 'Vegetables' },
    { value: 'Fruits', label: 'Fruits' },
    { value: 'Dairy & Eggs', label: 'Dairy & Eggs' },
    { value: 'Organic', label: 'Organic' },
  ]);

  useEffect(() => {
    fetch('/api/vendor-categories')
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const opts = json.data.map((c: any) => ({
            value: c.category_name,
            label: c.category_name,
          }));
          setCategoryOptions(opts);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (name: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!form.mobile_number.trim()) {
      setError('Mobile Number is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        email: form.email.trim() || `vendor_${form.mobile_number.replace(/\D/g, '') || Date.now()}@vegking.com`,
        password: form.password || 'Vendor@123',
        is_verified: form.is_verified ? '1' : '0',
        is_bestseller: form.is_bestseller ? '1' : '0',
        wallet_balance: Number(form.wallet_balance || 0),
        handling_charge: Number(form.handling_charge || 0),
      };

      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create vendor');
      }

      router.push('/admin/vendors');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Vendor</h1>
            <p className="text-sm text-gray-500">Register and link new vendor to MongoDB</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => router.push('/admin/vendors')}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError('')} className="font-bold text-red-800 hover:text-red-950">
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <FormSection title="Personal Information" columns={2}>
          <TextInput label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="e.g. Ramesh Kumar" />
          <TextInput label="Email" name="email" value={form.email} onChange={handleChange} type="email" placeholder="vendor@example.com (or auto-generated)" />
          <TextInput label="Mobile Number" name="mobile_number" value={form.mobile_number} onChange={handleChange} required placeholder="10-digit mobile number" />
          <TextInput label="Password" name="password" value={form.password} onChange={handleChange} type="password" placeholder="Default: Vendor@123" />
        </FormSection>

        {/* Shop Information */}
        <FormSection title="Shop Information" columns={2}>
          <TextInput label="Shop Name" name="shop_name" value={form.shop_name} onChange={handleChange} placeholder="e.g. Fresh Veggie Point" />
          <Select
            label="Shop Category"
            name="shop_category"
            value={form.shop_category}
            onChange={handleChange}
            placeholder="Select category..."
            options={categoryOptions}
          />
          <TextInput label="Business Type" name="business_type" value={form.business_type} onChange={handleChange} placeholder="e.g. Wholesale / Retail" />
          <TextInput label="Services Coverage" name="services_coverage" value={form.services_coverage} onChange={handleChange} placeholder="e.g. Pune City (15 km radius)" />
          <FullSpan>
            <FileUpload label="Shop Image" name="shop_image" value={form.shop_image} onChange={handleChange} helperText="Upload shop photo (JPG, PNG, WEBP)" />
          </FullSpan>
        </FormSection>

        {/* Business Documents */}
        <FormSection title="Business Documents" columns={2}>
          <TextInput label="GST Number" name="gst_number" value={form.gst_number} onChange={handleChange} placeholder="e.g. 27AAAAA0000A1Z5" />
          <TextInput label="PAN Number" name="pan_number" value={form.pan_number} onChange={handleChange} placeholder="e.g. ABCDE1234F" />
          <TextInput label="Licence Number" name="licence_number" value={form.licence_number} onChange={handleChange} placeholder="Trade/FSSAI Licence No." />
          <div /> {/* spacer */}
          <FileUpload label="GST Certificate" name="gst_certificate" value={form.gst_certificate} onChange={handleChange} accept="image/*,application/pdf" helperText="PDF or Image" />
          <FileUpload label="PAN Card" name="pan_card" value={form.pan_card} onChange={handleChange} accept="image/*,application/pdf" helperText="PDF or Image" />
          <FileUpload label="Aadhar Front" name="aadhar_front" value={form.aadhar_front} onChange={handleChange} helperText="Front side image" />
          <FileUpload label="Aadhar Back" name="aadhar_back" value={form.aadhar_back} onChange={handleChange} helperText="Back side image" />
        </FormSection>

        {/* Address Information */}
        <FormSection title="Address Information" columns={2}>
          <FullSpan>
            <Textarea label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Full street address..." />
          </FullSpan>
          <TextInput label="City" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Pune" />
          <TextInput label="State" name="state" value={form.state} onChange={handleChange} placeholder="e.g. Maharashtra" />
          <TextInput label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} placeholder="e.g. 411001" />
          <TextInput label="Country" name="country" value={form.country} onChange={handleChange} />
          <FullSpan>
            <TextInput label="Landmark" name="landmark" value={form.landmark} onChange={handleChange} placeholder="e.g. Near City Market" />
          </FullSpan>
        </FormSection>

        {/* GPS Location */}
        <FormSection title="GPS Location" columns={2}>
          <TextInput label="GPS Latitude" name="gps_lat" value={form.gps_lat} onChange={handleChange} placeholder="18.5204" />
          <TextInput label="GPS Longitude" name="gps_long" value={form.gps_long} onChange={handleChange} placeholder="73.8567" />
          <FullSpan>
            <Textarea label="GPS Location Description" name="gps_location" value={form.gps_location} onChange={handleChange} placeholder="e.g. Main Market, Shivajinagar, Pune" />
          </FullSpan>
        </FormSection>

        {/* Status & Settings */}
        <FormSection title="Status & Settings" columns={2}>
          <Toggle label="Is Verified" name="is_verified" value={form.is_verified} onChange={handleChange} helperText="Mark this vendor as verified (active in vendor list)" />
          <Toggle label="Is Bestseller" name="is_bestseller" value={form.is_bestseller} onChange={handleChange} helperText="Feature this vendor as bestseller" />
        </FormSection>

        {/* Financial Information */}
        <FormSection title="Financial Information" columns={2}>
          <TextInput label="Initial Wallet Balance" name="wallet_balance" value={form.wallet_balance} onChange={handleChange} prefix="₹" type="number" />
          <TextInput label="Handling Charge" name="handling_charge" value={form.handling_charge} onChange={handleChange} prefix="₹" type="number" />
        </FormSection>

        {/* Form Footer */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            disabled={saving}
            onClick={() => router.push('/admin/vendors')}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Creating Vendor...' : 'Create Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
