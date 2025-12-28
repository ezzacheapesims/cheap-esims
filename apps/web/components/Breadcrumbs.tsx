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
    <nav className={`flex items-center gap-2 text-sm font-mono font-bold uppercase ${className}`} aria-label="Breadcrumb">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {index === 0 ? (
            <Link
              href={item.href || '/'}
              className="text-gray-600 hover:text-black transition-colors flex items-center gap-1"
            >
              <Home className="h-3 w-3" />
            </Link>
          ) : (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              {item.href && index < breadcrumbs.length - 1 ? (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-black">{item.label}</span>
              )}
            </>
          )}
        </div>
      ))}
    </nav>
  );
}

