import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  ShoppingBag,
  MapPin,
  Lock,
  Bell,
  Camera,
  CreditCard,
  Trash2,
  Mail,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  FileText,
  UserCheck,
  HelpCircle,
  Clock
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'User & Customer Privacy Policy | VegKing',
  description: 'Official Privacy Policy, Consumer Data Protection Terms, Location Transparency, and Account Deletion Guidelines for VegKing Users.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/80 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation / Header Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-emerald-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to VegKing Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Official Play Store & Consumer Policy
            </span>
          </div>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-10 text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold mb-3 backdrop-blur-xs">
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span>VegKing Customer Platform</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Customer & User Privacy Policy
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 font-medium max-w-2xl">
              Last Updated &amp; Effective Date: September 2026 &bull; Compliant with Google Play Store Policies, India&apos;s Digital Personal Data Protection (DPDP) Act 2023, and Information Technology Act 2000.
            </p>
          </div>

          {/* Quick Highlights Summary Grid */}
          <div className="bg-emerald-50/50 border-b border-gray-200 p-6 sm:p-8">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Privacy At A Glance</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                <span className="font-black text-gray-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero Data Selling
                </span>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  We never sell, lease, or monetize your personal or shopping information to third-party ad brokers.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                <span className="font-black text-gray-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Bank-Grade Security
                </span>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  All transactions use 256-bit SSL encryption. Card and UPI credentials are handled by certified payment gateways.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                <span className="font-black text-gray-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Accurate Delivery Only
                </span>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Location is used only while browsing to show local fresh inventory and ensure doorstep delivery accuracy.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                <span className="font-black text-gray-900 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-emerald-600" /> Right to Erasure
                </span>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  You have complete control to request account and personal data deletion anytime directly via our support desk.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-9 text-sm text-gray-700 leading-relaxed">
            
            {/* 1. Introduction */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <span>1. Introduction &amp; Purpose</span>
              </h2>
              <p>
                VegKing (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or the &quot;Company&quot;) operates the <strong>VegKing</strong> grocery mobile application (Android / iOS) and the web portal (<Link href="/" className="text-emerald-700 font-bold hover:underline">vegking.com</Link>). Our platform connects consumers with fresh seasonal vegetables, organic produce, farm commodities, and grocery items with on-demand delivery.
              </p>
              <p>
                This Privacy Policy explains in transparent detail how we collect, process, utilize, share, and protect your personal data when you create an account, browse products, make purchases, subscribe to recurring produce packs, or communicate with customer service. By installing, registering with, or utilizing VegKing, you acknowledge and agree to the practices outlined in this policy.
              </p>
            </section>

            {/* 2. Information Collected */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <span>2. Information We Collect From You</span>
              </h2>
              <p>
                We only collect information necessary to deliver your orders quickly and securely, provide customer support, and personalize your grocery experience:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Identity &amp; Contact Information</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Your full name, mobile telephone number, email address, password (stored encrypted using secure salted cryptographic hashing), and optional profile photograph.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Addresses &amp; Geolocation</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Saved delivery addresses (House/Flat, Street, Landmark, City, State, PIN code) along with GPS coordinates pinned via our interactive map picker to ensure our delivery riders find your doorstep accurately.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>Orders &amp; Preferences</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Items added to cart, purchase history, bulk product requests, negotiation/bargain history, recurring vegetable subscriptions, delivery time preferences, and custom delivery instructions.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Payment &amp; Transaction Details</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Payment method used (UPI, Credit/Debit card, Net Banking, Wallet, Cash on Delivery) and transaction reference IDs. <em>Note: VegKing never collects or stores sensitive card numbers, CVV codes, or UPI PINs. All payment transactions are securely handled by PCI-DSS compliant, RBI-licensed payment gateways.</em>
                  </p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-1.5 sm:col-span-2">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-xs uppercase">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Technical &amp; Device Information</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Device model, operating system version, unique device identifiers, IP address, connection type, crash diagnostics, and Firebase Cloud Messaging (FCM) tokens required to dispatch real-time push notifications regarding your orders and delivery status.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Device Permissions & Transparency */}
            <section className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black text-emerald-950 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>3. Device Permissions &amp; Transparency (Google Play Compliance)</span>
                </h2>
                <p className="text-xs text-emerald-900 font-medium">
                  We strictly request device permissions only when required for core application operations:
                </p>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-950 font-bold">FOREGROUND GEOLOCATION ACCESS:</strong>
                    <p className="text-gray-600 text-xs mt-0.5">
                      Used when you add or select a delivery address to automatically detect your neighborhood and verify if VegKing delivers to your pin code. <strong>We do NOT track your background location when the app is closed or inactive.</strong>
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-start gap-3">
                  <Bell className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-950 font-bold">PUSH NOTIFICATIONS:</strong>
                    <p className="text-gray-600 text-xs mt-0.5">
                      Used to deliver crucial real-time updates: Order Confirmation, Packing Updates, &quot;Rider Out For Delivery&quot; alerts, delivery OTP verification, and subscription renewal alerts.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-start gap-3">
                  <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-950 font-bold">CAMERA &amp; PHOTO STORAGE (OPTIONAL):</strong>
                    <p className="text-gray-600 text-xs mt-0.5">
                      Requested only when you choose to take or upload a photo of a damaged item for refund claims or customer support inquiries, or update your account avatar.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. How We Use Your Information */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <span>4. How We Use Your Information</span>
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm list-disc pl-5 text-gray-700">
                <li>
                  <strong>Order Fulfillment:</strong> To process your grocery orders, pack fresh vegetables, route delivery riders to your accurate address, and verify delivery via a 4-digit Delivery OTP.
                </li>
                <li>
                  <strong>Customer Support &amp; Dispute Resolution:</strong> To assist you with order status, address adjustments, missing items, damaged produce refunds, and support chats.
                </li>
                <li>
                  <strong>Personalized Produce Experience:</strong> To suggest in-season vegetables, recurring subscription baskets, and customized bundle discounts suited to your household needs.
                </li>
                <li>
                  <strong>Security &amp; Fraud Prevention:</strong> To authenticate logins via OTP, safeguard user accounts against unauthorized access, and prevent abusive or fraudulent payment attempts.
                </li>
                <li>
                  <strong>Statutory &amp; Legal Compliance:</strong> To generate valid tax invoices (GST), maintain business transaction records, and comply with applicable consumer protection laws in India.
                </li>
              </ul>
            </section>

            {/* 5. Sharing & Disclosure */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <span>5. Data Sharing &amp; Third-Party Disclosures</span>
              </h2>
              <p>
                We do not sell, rent, or trade your personal information. We disclose limited data only to trusted service partners strictly necessary for executing your orders:
              </p>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="text-gray-900 font-bold block">Assigned Delivery Partners (Riders)</strong>
                  <span className="text-gray-600">
                    Riders assigned to your delivery are provided only your name, masked contact number, delivery address, and delivery instructions. Once the order is completed, your contact details are inaccessible to the rider.
                  </span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="text-gray-900 font-bold block">Merchant Vendors &amp; Warehouse Hubs</strong>
                  <span className="text-gray-600">
                    Sellers and fulfillment centers receive your item checklist and order identifier to pack fresh produce correctly.
                  </span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="text-gray-900 font-bold block">Licensed Payment Gateways</strong>
                  <span className="text-gray-600">
                    Payment processors (such as Razorpay) securely process your transactions over encrypted channels. We do not store sensitive payment card details.
                  </span>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="text-gray-900 font-bold block">Legal &amp; Law Enforcement Authorities</strong>
                  <span className="text-gray-600">
                    We may disclose information if required by applicable Indian law, court order, or governmental regulation to investigate fraud, cybercrimes, or safety breaches.
                  </span>
                </div>
              </div>
            </section>

            {/* 6. Security */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>6. Data Security &amp; Storage</span>
              </h2>
              <p>
                We enforce strict technical and organizational safeguards to protect your personal data. All data transmitted between your device and our servers is secured using modern Transport Layer Security (TLS/SSL 256-bit encryption). Customer passwords and sensitive credentials are encrypted using industry-standard salted hash algorithms. Our databases are hosted in certified cloud data centers with perimeter firewalls and strict role-based access restrictions.
              </p>
            </section>

            {/* 7. Cookies & Web Tracking */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>7. Cookies &amp; Local Storage</span>
              </h2>
              <p>
                Our website and web application use essential cookies and browser local storage to maintain your logged-in session, remember your shopping cart items across visits, and store your selected delivery address preferences. You can configure your browser to reject cookies, though some features (such as cart persistence) may not function as intended.
              </p>
            </section>

            {/* 8. User Rights & DPDP Act Compliance */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <span>8. Your Rights as a Data Principal (DPDP Act 2023)</span>
              </h2>
              <p>
                Under India&apos;s Digital Personal Data Protection Act (DPDP Act 2023) and applicable privacy regulations, you enjoy the following rights:
              </p>
              <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="text-gray-900 font-bold block mb-1">Right to Access</strong>
                  <p className="text-gray-600">You may review your profile, saved addresses, and complete order history directly in your VegKing user profile.</p>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="text-gray-900 font-bold block mb-1">Right to Rectification</strong>
                  <p className="text-gray-600">You can edit or update your contact details, active addresses, and notification preferences at any time.</p>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="text-gray-900 font-bold block mb-1">Right to Withdraw Consent</strong>
                  <p className="text-gray-600">You can revoke permissions (such as location or push notifications) anytime from your mobile device settings.</p>
                </div>
              </div>
            </section>

            {/* 9. Account Deletion & Data Retention */}
            <section className="bg-red-50/50 rounded-2xl p-5 sm:p-6 border border-red-200/80 space-y-3">
              <div className="flex items-center gap-2 text-red-950 font-black text-base">
                <Trash2 className="w-5 h-5 text-red-600 shrink-0" />
                <span>9. Account Deletion &amp; Data Erasure (Google Play Requirement)</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-700">
                You have the full right to delete your VegKing customer account and request the permanent deletion of your associated personal data.
              </p>
              <div className="bg-white p-4 rounded-xl border border-red-200 text-xs space-y-2 text-gray-700">
                <p className="font-bold text-gray-900">How to request account deletion:</p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>
                    Send an email to our dedicated privacy support team at{' '}
                    <a href="mailto:info@vegking.com?subject=User%20Account%20Deletion%20Request" className="text-emerald-700 font-bold underline">
                      info@vegking.com
                    </a>{' '}
                    with the subject line: <strong>&quot;User Account Deletion Request&quot;</strong>.
                  </li>
                  <li>
                    Include your registered mobile phone number and full name associated with your VegKing account.
                  </li>
                  <li>
                    Our team will verify your identity via OTP to ensure security and process the erasure within <strong>7 to 14 business days</strong>.
                  </li>
                </ol>
                <p className="text-[11px] text-gray-500 pt-1">
                  <em>Note: When your account is deleted, your active subscriptions, wallet balance, and profile data will be permanently removed. Statutory transactional records (such as completed order tax invoices) will be retained solely as required under Indian commercial and tax accounting laws.</em>
                </p>
              </div>
            </section>

            {/* 10. Children's Privacy */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                10. Children&apos;s Privacy
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                VegKing services are intended for individuals who are at least 18 years of age or authorized adults capable of forming legally binding contracts. We do not knowingly collect personal data from minors under 18 without parental supervision. If you believe a child has provided us with personal information without parental consent, please contact us immediately for prompt deletion.
              </p>
            </section>

            {/* 11. Grievance Officer & Contact Us */}
            <section className="border-t border-gray-200 pt-6 space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                <span>11. Grievance Redressal &amp; Contact Us</span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                In accordance with the Information Technology Act 2000, the Consumer Protection (E-Commerce) Rules 2020, and the Digital Personal Data Protection Act 2023, our Grievance Officer is designated below:
              </p>
              <div className="bg-gray-100/70 p-5 rounded-2xl text-xs space-y-1.5 font-medium text-gray-800 border border-gray-200">
                <p><strong>Designation:</strong> Grievance Officer &amp; Privacy Desk</p>
                <p><strong>Company:</strong> VegKing Technologies Pvt. Ltd.</p>
                <p><strong>Support &amp; Privacy Email:</strong> <a href="mailto:info@vegking.com" className="text-emerald-700 font-bold">info@vegking.com</a></p>
                <p><strong>Customer Helpline:</strong> +91 98765 43210 (Mon &ndash; Sun, 7:00 AM &ndash; 10:00 PM IST)</p>
                <p><strong>Registered Address:</strong> Fresh Market Road, Lucknow, Uttar Pradesh, India</p>
              </div>
            </section>

            {/* Footer Policy Links */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <Link href="/rider-privacy-policy" className="text-emerald-700 font-semibold hover:underline">
                  Delivery Partner Policy
                </Link>
                <span>&bull;</span>
                <Link href="/vendor-privacy-policy" className="text-emerald-700 font-semibold hover:underline">
                  Vendor &amp; Merchant Policy
                </Link>
              </div>
              <span>&copy; 2026 VegKing Technologies Pvt. Ltd.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
