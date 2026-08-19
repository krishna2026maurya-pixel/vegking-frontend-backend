'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';
import { 
  Building2, Loader2, Mail, MapPin, Phone, ShieldCheck, User, Lock, 
  ArrowLeft, ArrowRight, Upload, CheckCircle, FileText, Store
} from 'lucide-react';

const initialForm = {
  name: '',
  businessName: '',
  email: '',
  phone: '',
  address: '',
  gstNumber: '',
  panNumber: '',
  licenceNumber: '',
  gstCertificate: '',
  panCard: '',
  aadharFront: '',
  aadharBack: '',
  shopImage: '',
  password: '',
  confirmPassword: '',
};

export default function VendorRegisterPage() {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const update = (field: keyof typeof initialForm, value: string) => 
    setFormData((current) => ({ ...current, [field]: value }));

  const handleFileUpload = async (field: keyof typeof initialForm, file: File) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [field]: true }));
    setError('');

    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (res.ok && json.success && json.urls?.[0]) {
        update(field, json.urls[0]);
      } else {
        // Fallback to local Data URL (Base64) if upload API fails or Cloudinary config is missing
        const reader = new FileReader();
        reader.onloadend = () => {
          update(field, reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      // Fallback in case of server connection error
      const reader = new FileReader();
      reader.onloadend = () => {
        update(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const triggerError = (msg: string) => {
    setError(msg);
    showToast(msg, 'error');
  };

  const handleNextStep = () => {
    setError('');
    // Step 1 Validation
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
        triggerError('Please fill in all account fields.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        triggerError('Passwords do not match.');
        return;
      }
      if (formData.password.length < 6) {
        triggerError('Password must be at least 6 characters.');
        return;
      }
    }
    // Step 2 Validation
    if (step === 2) {
      if (!formData.businessName || !formData.phone || !formData.address) {
        triggerError('Please fill in all shop information fields.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      handleNextStep();
      return;
    }

    if (!formData.panNumber || !formData.licenceNumber) {
      triggerError('Please provide PAN and Licence numbers.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit application');
      }
      showToast('Application submitted successfully!', 'success');
      router.push('/vendor/login?registered=1');
    } catch (err: any) {
      triggerError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ label, field }: { label: string; field: keyof typeof initialForm }) => {
    const isUploaded = !!formData[field];
    const isUploading = !!uploading[field];

    return (
      <div className="space-y-1 text-left">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        <label className={`flex flex-col items-center justify-center border border-dashed rounded-xl p-2.5 cursor-pointer transition-all ${
          isUploaded 
            ? 'border-green-200 bg-green-50/20' 
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100/30'
        }`}>
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5 py-1">
              <Loader2 className="h-4.5 w-4.5 text-emerald-600 animate-spin" />
              <span className="text-[10px] font-bold text-gray-400">Uploading...</span>
            </div>
          ) : isUploaded ? (
            <div className="flex flex-col items-center gap-1 py-1 text-center">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-800">Uploaded</span>
              <span className="text-[9px] text-gray-400 truncate max-w-[100px]">{formData[field].substring(0, 20)}...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1 text-center">
              <Upload className="h-4.5 w-4.5 text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400">Upload File</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(field, file);
            }}
            className="sr-only"
          />
        </label>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50 antialiased overflow-x-hidden">
      {/* LEFT COLUMN: HERO PANEL */}
      <div 
        className="hidden md:flex md:w-1/2 p-10 flex-col justify-between relative bg-cover bg-center shrink-0"
        style={{ backgroundImage: `url('/images/vendor_signup_hero.png')` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        
        {/* Brand Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-8.5 w-8.5 relative shrink-0">
            <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base text-white tracking-tight">VegKing Merchant</span>
        </div>

        {/* Benefits Card */}
        <div className="relative z-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 max-w-md shadow-2xl">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/25">Partnership</span>
          <h2 className="text-2xl font-black text-white mt-3 tracking-tight leading-tight">Grow your business with VegKing</h2>
          <p className="text-xs font-medium text-gray-200 mt-1.5 leading-relaxed">Join hundreds of merchants supplying fresh vegetables, organic grains, and dairy products to thousands of households daily.</p>
          
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs text-gray-100 font-semibold">
              <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] shrink-0">✓</span>
              <span>Dedicated delivery rider fleet for all orders</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-100 font-semibold">
              <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] shrink-0">✓</span>
              <span>Direct bank settlement within 24 hours</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-100 font-semibold">
              <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-[10px] shrink-0">✓</span>
              <span>Advanced inventory & pricing controls</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[10px] text-gray-300 font-semibold">
          © 2026 VegKing Merchant Portal. All rights reserved.
        </div>
      </div>

      {/* RIGHT COLUMN: MULTISTEP FORM */}
      <div className="w-full md:w-1/2 bg-white flex flex-col justify-between py-8 px-6 sm:px-12 md:px-14 overflow-y-auto max-h-screen">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          
          {/* Mobile Logo & Header Link */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:hidden">
              <div className="h-8 w-8 relative shrink-0">
                <img src="/logo.png" alt="VegKing Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-sm text-gray-900 tracking-tight">VegKing</span>
            </div>
            <Link href="/vendor/login" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 ml-auto transition-colors">
              Already applied? <span className="underline">Login</span>
            </Link>
          </div>

          {/* Steps Progress Indicator */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-gray-400">
              <span>Step {step} of 3</span>
              <span className="text-emerald-600 font-black">
                {step === 1 ? 'Account Setup' : step === 2 ? 'Shop Profile' : 'Verification Docs'}
              </span>
            </div>
            {/* Smooth Progress bar */}
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-[#10b981] transition-all duration-300 rounded-full" 
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Header */}
          <div>
            <h1 className="text-lg font-black text-gray-950 tracking-tight">
              {step === 1 ? 'Start with Account Details' : step === 2 ? 'Tell us about your Shop' : 'Upload Verification Docs'}
            </h1>
            <p className="mt-1 text-[11px] font-semibold text-gray-400">
              {step === 1 
                ? 'Configure credentials to access your merchant dashboard.' 
                : step === 2 
                  ? 'Provide location and business name for customer reach.' 
                  : 'Complete application with documents for verification.'}
            </p>
          </div>



          {/* Steps Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* STEP 1: Account setup */}
            {step === 1 && (
              <div className="space-y-3.5 animate-scale-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Merchant Full Name</label>
                  <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                  <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="e.g. rajesh@store.com"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                  <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                  <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <Lock className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => update('confirmPassword', e.target.value)}
                      placeholder="Re-enter password"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Shop details */}
            {step === 2 && (
              <div className="space-y-3.5 animate-scale-in">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Business / Shop Name</label>
                  <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => update('businessName', e.target.value)}
                      placeholder="e.g. Fresh Agro Farms"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contact Phone Number</label>
                  <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Business Address</label>
                  <div className="flex h-12 items-start gap-2.5 border border-gray-200 rounded-xl bg-gray-50 p-2.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="e.g. Shop 23, Vegetable Market, Area-3"
                      className="w-full h-full bg-transparent text-xs font-semibold outline-none resize-none text-gray-800"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Document uploads */}
            {step === 3 && (
              <div className="space-y-3.5 animate-scale-in">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">PAN Number</label>
                    <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => update('panNumber', e.target.value)}
                        placeholder="ABCDE1234F"
                        className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800 uppercase"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">FSSAI Licence No.</label>
                    <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                      <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={formData.licenceNumber}
                        onChange={(e) => update('licenceNumber', e.target.value)}
                        placeholder="14-digit number"
                        className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">GST Number (Optional)</label>
                  <div className="flex h-10 items-center gap-2.5 border border-gray-200 rounded-xl bg-gray-50 px-3.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                    <ShieldCheck className="h-4 w-4 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => update('gstNumber', e.target.value)}
                      placeholder="e.g. 22AAAAA0000A1Z5"
                      className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none text-gray-800 uppercase"
                    />
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2">
                  <FileUploadField label="PAN Card Image" field="panCard" />
                  <FileUploadField label="GST Certificate" field="gstCertificate" />
                  <FileUploadField label="Aadhar Card (Front)" field="aadharFront" />
                  <FileUploadField label="Aadhar Card (Back)" field="aadharBack" />
                  <FileUploadField label="Shop Image" field="shopImage" />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-2 flex gap-3.5">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex h-10 items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-bold w-1/3 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`flex h-10 items-center justify-center gap-1.5 text-xs font-extrabold text-white rounded-xl bg-gradient-to-r from-emerald-500 to-[#10b981] shadow-md shadow-emerald-100 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer ${
                  step > 1 ? 'w-2/3' : 'w-full'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : step === 3 ? (
                  'Submit Application'
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
