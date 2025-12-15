import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black text-white border-t-4 border-primary mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4 text-primary">
                <Zap className="h-6 w-6 fill-current" />
                <span className="text-xl font-black italic uppercase">Cheap eSIMs</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs font-mono">
              We provide the cheapest possible data for travelers. No frills. No hidden fees. Just internet.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm border-b border-gray-800 pb-2 inline-block">Support</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-300">
              <li><Link href="/support" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Help Center</Link></li>
              <li><Link href="/device-check" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Device Check</Link></li>
              <li><Link href="/contact" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Contact Us</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm border-b border-gray-800 pb-2 inline-block">Regions</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-300">
              <li><Link href="/regions/europe" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Europe</Link></li>
              <li><Link href="/regions/asia" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Asia</Link></li>
              <li><Link href="/regions/north-america" className="hover:text-primary hover:underline underline-offset-4 decoration-2">USA & Canada</Link></li>
              <li><Link href="/" className="hover:text-primary hover:underline underline-offset-4 decoration-2">All Countries</Link></li>
            </ul>
          </div>

           <div>
            <h4 className="font-bold mb-6 text-primary uppercase tracking-wider text-sm border-b border-gray-800 pb-2 inline-block">Legal</h4>
            <ul className="space-y-3 text-sm font-medium text-gray-300">
              <li><Link href="/terms" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Privacy Policy</Link></li>
              <li><Link href="/refunds" className="hover:text-primary hover:underline underline-offset-4 decoration-2">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 font-mono">
          <p>&copy; {new Date().getFullYear()} Cheap eSIMs. All rights reserved.</p>
          <p>Prices in USD unless otherwise noted.</p>
        </div>
      </div>
    </footer>
  );
}
