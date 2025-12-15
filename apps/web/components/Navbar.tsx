"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { NavigationUserMenu } from "@/components/NavigationUserMenu";
import { CurrencySelector } from "@/components/CurrencySelector";
import { Button } from "@/components/ui/button";
import { ShoppingBag, HelpCircle, User } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-foreground text-background border-b-2 border-primary">
      <div className="w-full max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo Area */}
        <Link href="/" className="flex flex-col leading-none group">
          <span className="text-2xl font-black tracking-tighter text-primary group-hover:text-white transition-colors uppercase italic">
            Cheap eSIMs
          </span>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            DISCOUNT DATA
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1 bg-white/10 p-1 rounded-sm">
           <Link href="/" className="px-4 py-1.5 text-sm font-bold hover:bg-primary hover:text-black transition-all rounded-sm">Store</Link>
           <Link href="/regions/europe" className="px-4 py-1.5 text-sm font-bold hover:bg-primary hover:text-black transition-all rounded-sm">Europe</Link>
           <Link href="/regions/asia" className="px-4 py-1.5 text-sm font-bold hover:bg-primary hover:text-black transition-all rounded-sm">Asia</Link>
           <Link href="/regions/global" className="px-4 py-1.5 text-sm font-bold hover:bg-primary hover:text-black transition-all rounded-sm">Global</Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
             <CurrencySelector />
          </div>

          <div className="flex items-center gap-2">
            <SignedOut>
              <Button variant="ghost" asChild size="sm" className="text-background hover:text-primary hover:bg-transparent">
                <Link href="/sign-in" className="font-bold">Login</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary text-black font-bold hover:bg-white hover:text-black border-none rounded-none">
                <Link href="/sign-up">
                  JOIN FREE
                </Link>
              </Button>
            </SignedOut>

            <SignedIn>
              <NavigationUserMenu />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
