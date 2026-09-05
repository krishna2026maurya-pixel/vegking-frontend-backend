import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Store, Camera, CreditCard, Trash2, Mail, ArrowLeft, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Merchant & Vendor Privacy Policy | VegKing',
  description: 'Official Privacy Policy, Business Data Protection Terms, and Regulatory Compliance for VegKing Vendors and Store Partners.',
};

export default function VendorPrivacyPolicyPage() {
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
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-6 sm:p-8 text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold mb-3 backdrop-blur-xs">
              <Store className="w-4 h-4 text-emerald-300" />
              <span>VegKing Merchant Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Vendor & Merchant Partner Privacy Policy
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-2 font-medium">
              Effective Date: September 2026 &bull; Compliant with Google Play Store & E-Commerce Regulations
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">
            
            {/* 1. Introduction */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                1. Introduction & Scope
              </h2>
              <p>
                VegKing (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides the <strong>VegKing Vendor / Merchant Application</strong> for produce sellers, farmers, and wholesale partners to list, sell, and manage fresh vegetables, bulk agricultural commodities, and groceries. This document details how we handle vendor business, operational, and financial data.
              </p>
            </section>

            {/* 2. Information Collected */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                2. Business & Personal Information Collected
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <strong className="block text-gray-900 font-bold text-xs uppercase">Store & Contact Profile</strong>
                  <p className="text-gray-600">Merchant business name, contact person name, authorized email address, mobile number, and physical store/warehouse address.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <strong className="block text-gray-900 font-bold text-xs uppercase">Statutory & KYC Records</strong>
                  <p className="text-gray-600">GSTIN registration, FSSAI food safety licence, PAN card details, and business proof documents required by food retail regulations.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <strong className="block text-gray-900 font-bold text-xs uppercase">Banking & Settlement Data</strong>
                  <p className="text-gray-600">Bank account holder name, account number, IFSC code, and cancelled cheque images for automated payout transfers.</p>
                </div>
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <strong className="block text-gray-900 font-bold text-xs uppercase">Catalog & Inventory Data</strong>
                  <p className="text-gray-600">Product listings, item weights, selling rates, wholesale bulk discount parameters, and high-resolution produce images.</p>
                </div>
              </div>
            </section>

            {/* 3. Device Permissions */}
            <section className="space-y-3">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                3. Application Permissions & Purpose
              </h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">CAMERA & PHOTOS ACCESS:</strong>
                    <span className="text-gray-600 block mt-0.5">Used by vendors to photograph produce items directly for product catalogs and upload food safety or GST registration certificates.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">STORE GEOLOCATION:</strong>
                    <span className="text-gray-600 block mt-0.5">Used to pinpoint your store or farm pickup location on the map so nearby customers can discover your products and delivery riders can navigate to your pickup counter.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-150">
                  <CreditCard className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">FINANCIAL & BILLING RECORDS:</strong>
                    <span className="text-gray-600 block mt-0.5">Used strictly to calculate sales revenues, deduct applicable platform fees, and disburse weekly automated bank transfers.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Customer Data Access Rules */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                4. Customer Data Confidentiality
              </h2>
              <p>
                Vendors receive customer order information (customer name, delivery address, and contact numbers) strictly for fulfilling orders. Vendors are legally prohibited from copying, exporting, marketing to, or sharing customer personal information outside the VegKing platform.
              </p>
            </section>

            {/* 5. Data Security & Storage */}
            <section className="space-y-2">
              <h2 className="text-base sm:text-lg font-black text-gray-950">
                5. Security & Data Protection
              </h2>
              <p>
                We employ industry-standard 256-bit SSL encryption, tokenized authentication, and restricted database access to protect vendor financial, banking, and commercial trade records against unauthorized tampering or disclosure.
              </p>
            </section>

            {/* 6. Account Deletion & Termination */}
            <section className="bg-gray-50 rounded-2xl p-5 border border-gray-200 space-y-3">
              <div className="flex items-center gap-2 text-gray-950 font-black text-base">
                <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
                <span>6. Vendor Account Deletion & Data Retention</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">
                Vendors wishing to close their store and delete their data can request account termination by writing to <a href="mailto:vendor-support@vegking.com" className="text-emerald-700 font-bold underline">vendor-support@vegking.com</a> from their registered vendor email. All active listings will be delisted immediately, and account information will be purged following settlement of all pending customer deliveries and financial dues.
              </p>
            </section>

            {/* 7. Contact Us */}
            <section className="border-t border-gray-200 pt-6 space-y-2">
              <h2 className="text-base font-black text-gray-950 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>7. Vendor Support & Grievances</span>
              </h2>
              <p className="text-xs text-gray-600">
                For merchant inquiries, technical assistance, or privacy policy questions:
              </p>
              <div className="bg-gray-100/70 p-4 rounded-xl text-xs space-y-1 font-medium text-gray-800">
                <p><strong>Entity:</strong> VegKing Technologies Pvt. Ltd. (Merchant Operations)</p>
                <p><strong>Merchant Email:</strong> <a href="mailto:vendor-support@vegking.com" className="text-emerald-700 font-bold">vendor-support@vegking.com</a></p>
                <p><strong>Helpline:</strong> +91 98765 43210</p>
                <p><strong>Headquarters:</strong> Lucknow, Uttar Pradesh, India</p>
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
