'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Mail, MapPin, Phone, ShieldCheck, User } from 'lucide-react';

const initialForm = {
    name: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    password: '',
    confirmPassword: '',
};

export default function VendorRegisterPage() {
    const [formData, setFormData] = useState(initialForm);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const update = (field: keyof typeof initialForm, value: string) => 
        setFormData((current) => ({ ...current, [field]: value }));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            // DUMMY API CALL: Simulate network request since /api/vendor/register isn't built yet
            await new Promise((resolve) => setTimeout(resolve, 1500));
            router.push('/vendor/login?registered=1');
        } catch {
            setError('Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const fields: Array<[keyof typeof initialForm, string, string, any]> = [
        ['name', 'Name', 'text', User],
        ['businessName', 'Business Name', 'text', Building2],
        ['email', 'Email', 'email', Mail],
        ['phone', 'Phone', 'tel', Phone],
        ['address', 'Address', 'text', MapPin],
        ['gstNumber', 'GST Number (optional)', 'text', ShieldCheck],
        ['password', 'Password', 'password', ShieldCheck],
        ['confirmPassword', 'Confirm Password', 'password', ShieldCheck],
    ];

    return (
        <div className="min-h-screen bg-[#f6faf5] px-4 py-12">
            <div className="mx-auto max-w-4xl border border-gray-100 bg-white p-6 shadow-xl shadow-green-900/10 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-green-700">Vendor Application</p>
                        <h1 className="mt-2 text-3xl font-black text-gray-950">Create vendor account</h1>
                        <p className="mt-2 text-sm font-medium text-gray-500">Applications are reviewed by admin before dashboard access.</p>
                    </div>
                    <Link href="/vendor/login" className="text-sm font-black text-green-700 hover:underline">Already applied?</Link>
                </div>

                {error && <div className="mt-6 border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-600">{error}</div>}

                <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
                    {fields.map(([field, label, type, Icon]) => (
                        <label key={field} className={field === 'address' ? 'sm:col-span-2' : ''}>
                            <span className="text-xs font-black uppercase tracking-wide text-gray-500">{label}</span>
                            <div className="mt-2 flex h-12 items-center gap-3 border border-gray-200 bg-gray-50 px-4 focus-within:border-green-500 focus-within:bg-white">
                                <Icon className="h-4 w-4 text-gray-400" />
                                <input
                                    type={type}
                                    value={formData[field]}
                                    onChange={(event) => update(field, event.target.value)}
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                                    required={field !== 'gstNumber'}
                                />
                            </div>
                        </label>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 flex h-12 items-center justify-center gap-2 bg-green-600 text-sm font-extrabold text-white transition hover:bg-green-700 disabled:opacity-70 sm:col-span-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Application'}
                    </button>
                </form>
            </div>
        </div>
    );
}
