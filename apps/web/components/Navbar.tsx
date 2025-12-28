"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import { NavigationUserMenu } from "@/components/NavigationUserMenu";
import { CurrencySelector } from "@/components/CurrencySelector";
import { SearchDropdown } from "@/components/SearchDropdown";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ShoppingBag, HelpCircle, User, Menu, X, Globe, LifeBuoy, LogIn, UserPlus, Smartphone, LogOut } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isAdmin } = useIsAdmin();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push("/");
  };

  const navLinks = [
    { name: "eSIM Plans", href: "/", icon: <ShoppingBag className="h-4 w-4" /> },
    { name: "Support", href: "/support", icon: <LifeBuoy className="h-4 w-4" /> },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-foreground text-background border-b-2 border-primary">
      <div className="w-full max-w-7xl mx-auto px-4 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo Area */}
        <Link href="/" className="flex flex-col leading-none group">
          <span className="text-2xl font-black tracking-tighter text-primary group-hover:text-white transition-colors uppercase italic">
            Cheap eSIMs
          </span>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            DISCOUNT DATA
          </span>
        </Link>

        {/* Search Bar - Centered */}
        <div className="hidden md:flex justify-center">
          <SearchDropdown />
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <CurrencySelector />

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

        {/* Mobile Menu Trigger */}
        <div className="md:hidden flex items-center gap-2">
          <div className="flex-1 max-w-xs">
            <SearchDropdown />
          </div>
          <CurrencySelector />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-background hover:bg-primary/20">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-foreground border-l-2 border-primary w-[300px]">
              <SheetHeader className="text-left border-b-2 border-primary pb-4 mb-4">
                <SheetTitle className="text-primary text-xl font-black uppercase flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Cheap eSIMs
                </SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Menu</h4>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(link.href)
                          ? "bg-primary/20 text-primary"
                          : "text-background hover:bg-primary/10"
                      }`}
                    >
                      {link.icon}
                      <span className="font-medium">{link.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="h-px bg-primary/30" />

                <div className="flex flex-col gap-4">
                  <SignedOut>
                     <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h4>
                    <Link href="/sign-in" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full justify-start border-2 border-primary text-background hover:bg-primary hover:text-black">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setIsOpen(false)}>
                      <Button className="w-full justify-start bg-primary hover:bg-white text-black font-bold">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  </SignedOut>

                  <SignedIn>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h4>
                    <Link 
                      href="/account" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-background hover:bg-primary/10"
                    >
                      <User className="h-4 w-4" />
                      <span className="font-medium">My Account</span>
                    </Link>
                    <Link 
                      href="/my-esims" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-background hover:bg-primary/10"
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">My eSIMs</span>
                    </Link>
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-background hover:bg-primary/10"
                      >
                        <HelpCircle className="h-4 w-4" />
                        <span className="font-medium">Admin</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-background hover:bg-primary/10 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </SignedIn>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
