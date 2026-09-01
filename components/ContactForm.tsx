"use client";
import { useState } from 'react';
import { ArrowRight, Send, Loader2, AlertCircle } from 'lucide-react';
export default function ContactForm() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', topic: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const validateField = (name: string, value: string) => {
    let error = '';
    if (name === 'name' && !/^[A-Za-z\s]+$/.test(value)) {
      error = 'Name should contain only alphabets';
    }
    if (name === 'phone' && value && !/^[0-9+-\s]+$/.test(value)) {
      error = 'Phone should contain only numbers';
    }
    if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Please enter a valid email address';
    }
    if (name === 'message' && !value.trim()) {
      error = 'Message cannot be empty';
    }
    if (name === 'topic' && !value) {
      error = 'Please select a topic';
    }
    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    // Strip invalid chars on paste for name and phone
    if (name === 'name') value = value.replace(/[^A-Za-z\s]/g, '');
    if (name === 'phone') value = value.replace(/[^0-9+\-\s]/g, '');
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  // Block invalid keys WHILE typing (real-time restriction)
  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: letters, space, backspace, delete, arrows, tab, home, end
    const allowed = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Tab', 'Home', 'End', 'Shift', 'Control', 'Meta', 'CapsLock', ' '
    ];
    if (allowed.includes(e.key)) return;
    // Allow ctrl+A/C/V/X/Z for copy-paste-undo
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;
    // Block anything that's not a letter
    if (!/^[A-Za-z]$/.test(e.key)) e.preventDefault();
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: digits, +, -, space, and control keys
    const allowed = [
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Tab', 'Home', 'End', 'Shift', 'Control', 'Meta'
    ];
    if (allowed.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;
    // Allow digits, +, -, space
    if (!/^[0-9+\-\s]$/.test(e.key)) e.preventDefault();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError('');

    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key as keyof typeof formData]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);

    if (Object.values(newErrors).some((err) => err)) {
      return;
    }

    setLoading(true);
    try {
      // DUMMY API CALL: Simulate network request since /api/contact isn't built yet
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSent(true);
      setFormData({ name: '', phone: '', email: '', topic: '', message: '' });
      setErrors({});
    } catch (err) {
      setSubmitError('An error occurred while sending your message.');
    }
    setLoading(false);
  };

  return (
    <div className="border border-gray-100 bg-white p-5 shadow-xl shadow-green-900/5 sm:p-7 lg:p-8">
      <div className="mb-6 flex flex-col gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-green-700">Send a message</p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">We will get back soon</h2>
        </div>
        {/* <Send className="hidden h-8 w-8 text-orange-500 sm:block" /> */}
      </div>

      {submitError && (
        <div className="mb-5 flex items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          <AlertCircle className="h-5 w-5" />
          {submitError}
        </div>
      )}

      {sent ? (
        <div className="mb-5 border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          Thanks for reaching out. Our team will contact you soon.
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Name *</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleNameKeyDown}
                placeholder="Your full name"
                required
                className={`h-12 w-full border bg-gray-50 px-4 text-sm font-semibold text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-green-500/10 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
              />
              {errors.name && <span className="text-xs text-red-500 font-bold">{errors.name}</span>}
            </label>

            <label className="space-y-2">
              <span className="text-xs font-black uppercase tracking-widest text-gray-500">Phone</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handlePhoneKeyDown}
                placeholder="+91"
                className={`h-12 w-full border bg-gray-50 px-4 text-sm font-semibold text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-green-500/10 ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                  }`}
              />
              {errors.phone && <span className="text-xs text-red-500 font-bold">{errors.phone}</span>}
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Email *</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@example.com"
              required
              className={`h-12 w-full border bg-gray-50 px-4 text-sm font-semibold text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-green-500/10 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                }`}
            />
            {errors.email && <span className="text-xs text-red-500 font-bold">{errors.email}</span>}
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Topic *</span>
            <select
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`h-12 w-full border bg-gray-50 px-4 text-sm font-semibold text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-green-500/10 ${errors.topic ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                }`}
            >
              <option value="" disabled>
                Choose a support topic
              </option>
              <option>Order support</option>
              <option>Delivery question</option>
              <option>Subscription help</option>
              <option>Product quality</option>
              <option>Bulk enquiry</option>
            </select>
            {errors.topic && <span className="text-xs text-red-500 font-bold">{errors.topic}</span>}
          </label>

          <label className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">Message *</span>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={5}
              placeholder="Tell us how we can help..."
              required
              className={`w-full resize-none border bg-gray-50 px-4 py-3 text-sm font-semibold leading-7 text-gray-900 outline-none transition focus:bg-white focus:ring-2 focus:ring-green-500/10 ${errors.message ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'
                }`}
            />
            {errors.message && <span className="text-xs text-red-500 font-bold">{errors.message}</span>}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 bg-green-600 px-6 text-sm font-extrabold text-white shadow-md shadow-green-700/15 transition hover:bg-green-700 disabled:bg-gray-400 cursor-pointer sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send Message
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
