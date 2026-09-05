import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, MapPin, Camera, Phone, Trash2, Mail, ArrowLeft, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Delivery Partner (Rider) Privacy Policy | VegKing',
  description: 'Official Privacy Policy, Background Location Disclosure, and Data Protection Terms for VegKing Delivery Partners and Riders.',
};

export default function RiderPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50/80 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation / Header Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-emerald-700 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to VegKing Home</span>
          </Link>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Official Play Store Policy
          </span>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold mb-3 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>VegKing Partner Network</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Delivery Partner (Rider) Privacy Policy
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 font-medium">
              Effective Date: September 2026 &bull; Compliant with Google Play Store & Apple App Store Policies
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
            
            {/* 1. Introduction */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950 flex items-center gap-2">
                <span>1. Introduction & Overview</span>
              </h2>
              <p>
                VegKing (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the <strong>VegKing Delivery Partner App</strong> for independent delivery drivers and riders. This Privacy Policy informs our delivery personnel about our policies regarding the collection, use, disclosure, and safeguarding of personal and operational data when using our Rider application.
              </p>
            </section>

            {/* 2. PROMINENT BACKGROUND LOCATION DISCLOSURE (CRITICAL FOR PLAY STORE) */}
            <section className="bg-emerald-50/70 border-2 border-emerald-500/60 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-950 font-black text-base">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>2. Prominent Disclosure: Background Location Access</span>
              </div>
              <p className="text-emerald-950 font-medium">
                <strong>Google Play Location Policy Compliance:</strong> The VegKing Delivery Partner application collects and processes accurate, real-time location data (including <strong>in the background when the app is closed or not in active use</strong>) for the following core functionalities:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-emerald-900 font-medium">
                <li>
                  <strong>Nearby Order Dispatch:</strong> To identify delivery orders from nearby vendors and assign delivery tasks efficiently based on your current physical proximity.
                </li>
                <li>
                  <strong>Live Customer Order Tracking:</strong> To display live delivery progress and estimated time of arrival (ETA) to customers awaiting their fresh produce.
                </li>
                <li>
                  <strong>Distance & Payout Verification:</strong> To calculate exact travel distance for fair earnings, delivery fees, and fuel allowances.
                </li>
                <li>
                  <strong>Rider Safety & Emergency Assistance:</strong> To verify route integrity and provide emergency support if unexpected delays or accidents occur.
                </li>
              </ul>
              <div className="bg-white/80 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Control:</strong> Background location tracking begins only when you toggle your status to <strong>&quot;Online / Active&quot;</strong> in the app and terminates immediately when you toggle to <strong>&quot;Offline&quot;</strong> or finish your shift.
                </span>
              </div>
            </section>

            {/* 3. Information Collected */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                3. Personal & Identity Information Collected
              </h2>
              <p>During registration and onboarding, we collect the following information:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="block text-gray-900 font-bold text-xs uppercase mb-1">Rider Identity</strong>
                  <p className="text-xs text-gray-600">Full legal name, mobile phone number, email address, emergency contact, and profile photograph.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <strong className="block text-gray-900 font-bold text-xs uppercase mb-1">KYC & Vehicle Records</strong>
                  <p className="text-xs text-gray-600">Driving licence number, vehicle registration certificate (RC), vehicle type (Bike, Scooter), and insurance details.</p>
                </div>
              </div>
            </section>

            {/* 4. App Permissions Required */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                4. Device Permissions & Purpose
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">ACCESS_FINE_LOCATION & ACCESS_BACKGROUND_LOCATION:</strong>
                    <span className="text-gray-600 block mt-0.5">Required for automatic order assignment, navigation, and live customer tracking.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">CAMERA & MEDIA_STORAGE:</strong>
                    <span className="text-gray-600 block mt-0.5">Required to capture photo proof of delivery and upload licence / verification documents.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">CALL_PHONE:</strong>
                    <span className="text-gray-600 block mt-0.5">Allows the rider to contact customers or customer support directly to resolve address queries.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Data Sharing */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                5. How We Share Information
              </h2>
              <p>
                We do not sell your personal data. We share limited delivery partner data solely as required to fulfill delivery operations:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li><strong>With Customers:</strong> Only your first name, vehicle type, vehicle number, masked phone number, and live GPS map location during an active delivery.</li>
                <li><strong>With Vendors:</strong> Rider name and contact information for order handoff at the store.</li>
                <li><strong>Legal & Law Enforcement:</strong> Only when legally required by applicable local laws and government subpoenas.</li>
              </ul>
            </section>

            {/* 6. Data Retention & Account Deletion */}
            <section className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
              <div className="flex items-center gap-2 text-gray-950 font-black text-base">
                <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                <span>6. Account Deletion & Data Retention</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Riders have the right to request deletion of their account and associated personal data at any time. To request account termination, email our privacy team at <a href="mailto:info@vegking.com" className="text-emerald-700 font-bold underline">info@vegking.com</a> with your registered mobile number. Your personal identification and vehicle data will be purged within 30 days, subject to standard financial accounting compliance requirements.
              </p>
            </section>

            {/* 7. Contact Us */}
            <section className="border-t border-gray-200 pt-6 space-y-2">
              <h2 className="text-base font-black text-gray-950 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>7. Grievance Officer & Contact Us</span>
              </h2>
              <p className="text-xs text-gray-600">
                For questions, concerns, or privacy requests regarding the VegKing Delivery Partner App:
              </p>
              <div className="bg-gray-100/70 p-4 rounded-xl text-xs space-y-1 font-medium text-gray-800">
                <p><strong>Entity:</strong> VegKing Technologies Pvt. Ltd.</p>
                <p><strong>Email:</strong> <a href="mailto:info@vegking.com" className="text-emerald-700 font-bold">info@vegking.com</a></p>
                <p><strong>Support Phone:</strong> +91 98765 43210</p>
                <p><strong>Address:</strong> Lucknow, Uttar Pradesh, India</p>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
