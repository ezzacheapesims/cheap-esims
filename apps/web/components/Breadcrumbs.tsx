"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs from pathname if items not provided
  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const paths = pathname.split('/').filter(Boolean);
    const result: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Don't make the last item a link (current page)
      if (index === paths.length - 1) {
        result.push({ label });
      } else {
        result.push({ label, href: currentPath });
      }
    });
    
    return result;
  })();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className={`flex items-center gap-2 text-xs font-black uppercase tracking-tight ${className}`} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index === 0 ? (
            <Link
              href={item.href || '/'}
              className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1 group"
            >
              <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </Link>
          ) : (
            <>
              <ChevronRight className="h-3 w-3 text-gray-400" />
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-black hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-black bg-primary/20 px-2 py-0.5 border border-primary/30">{item.label}</span>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}

