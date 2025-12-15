"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function TermsOfService() {
  return (
    <Card className="bg-white border-2 border-black rounded-none shadow-hard overflow-hidden">
      <CardContent className="p-0">
        <div className="p-8 border-b-2 border-black bg-secondary">
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">Terms of Service</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm font-mono">
             <p className="text-gray-500 font-bold uppercase">
               Last updated: <span className="text-black">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
             </p>
             <div className="hidden md:block w-1 h-1 bg-black rounded-full"></div>
             <p className="text-gray-600">
               Please read these Terms of Service carefully before using Voyage eSIM services.
             </p>
          </div>
        </div>

        <div className="p-8 space-y-8 font-mono text-sm">
          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">1. Definitions</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p><strong className="text-black uppercase">"Voyage"</strong> refers to our eSIM marketplace platform and services.</p>
              <p><strong className="text-black uppercase">"eSIM"</strong> refers to the electronic SIM profile provided through our platform.</p>
              <p><strong className="text-black uppercase">"Service"</strong> refers to the eSIM data packages and related services we provide.</p>
              <p><strong className="text-black uppercase">"User"</strong> refers to any person or entity using our services.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">2. Account Requirements</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• You must be at least 18 years old to create an account and purchase eSIMs.</p>
              <p>• You are responsible for maintaining the confidentiality of your account credentials.</p>
              <p>• You must provide accurate and complete information when creating an account.</p>
              <p>• You are responsible for all activities that occur under your account.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">3. Usage Rules</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• eSIMs are for personal use only and may not be resold or transferred to third parties.</p>
              <p>• You must use the eSIM in accordance with applicable local laws and regulations.</p>
              <p>• You are responsible for ensuring your device is compatible with eSIM technology.</p>
              <p>• Data usage is subject to fair use policies and may be throttled if excessive.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">4. Restrictions</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• You may not use our services for illegal activities or in violation of any laws.</p>
              <p>• You may not attempt to hack, disrupt, or interfere with our platform or services.</p>
              <p>• You may not reverse engineer or attempt to extract eSIM data for unauthorized use.</p>
              <p>• You may not use automated systems to purchase or manage eSIMs without permission.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">5. Refund Rules</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• Refunds are only available if the eSIM has not been installed and no data has been used.</p>
              <p>• Refund requests must be made before the eSIM's validity period expires.</p>
              <p>• Refunds are processed within 3-5 business days after approval.</p>
              <p>• Please refer to our detailed Refund Policy for complete terms.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">6. Top-Up Rules</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• Top-ups extend your eSIM's validity and add data to your existing profile.</p>
              <p>• Top-up purchases are final and non-refundable once processed.</p>
              <p>• Top-ups must be purchased before your current eSIM expires.</p>
              <p>• Data from top-ups is added to your existing data allowance.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">7. Liability Limitations</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• Voyage provides eSIM services "as is" without warranties of any kind.</p>
              <p>• We are not responsible for network coverage, signal strength, or connectivity issues.</p>
              <p>• We are not liable for any damages resulting from the use or inability to use our services.</p>
              <p>• Our liability is limited to the amount you paid for the specific eSIM in question.</p>
              <p>• We are not responsible for device compatibility issues - users must verify compatibility before purchase.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">8. Service Availability</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• We reserve the right to modify, suspend, or discontinue services at any time.</p>
              <p>• Network coverage and speeds vary by location and are subject to local operator capabilities.</p>
              <p>• We do not guarantee uninterrupted or error-free service.</p>
              <p>• Some countries or regions may have restrictions on eSIM usage.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">9. Payment Terms</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>• All prices are displayed in USD, with local currency conversion available.</p>
              <p>• Payments are processed securely through our payment partners.</p>
              <p>• You authorize us to charge your payment method for all purchases.</p>
              <p>• All sales are final unless a refund is approved per our refund policy.</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-black text-black uppercase mb-3 border-b border-black pb-1 inline-block">10. Contact Information</h3>
            <div className="text-gray-600 space-y-2 ml-4">
              <p>For questions about these Terms of Service, please contact us:</p>
              <p>• Support: <Link href="/support/contact" className="text-primary font-bold hover:underline">Contact Form</Link></p>
              <p>• Email: Available through our support contact form</p>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t-2 border-black">
          <p className="text-gray-500 font-mono text-xs uppercase font-bold text-center">
            By using Voyage services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
