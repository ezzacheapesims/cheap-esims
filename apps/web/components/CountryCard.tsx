import Link from "next/link";
import { FlagIcon } from "./FlagIcon";
import { getSlugFromCode } from "@/lib/country-slugs";

interface Country {
  code: string;
  name: string;
  locationLogo?: string;
  type?: number; // 1 = country, 2 = region
}

export function CountryCard({ country }: { country: Country }) {
  // If it's a region (type 2), link to /regions/ with the code
  // Otherwise, link to /countries/ with the slug
  const isRegion = country.type === 2;
  const href = isRegion 
    ? `/regions/${country.code.toLowerCase()}` 
    : `/countries/${getSlugFromCode(country.code) || country.code.toLowerCase()}`;
  
  return (
    <Link href={href} className="block group h-full">
      <div className="h-full bg-white border-2 border-black p-3 hover:bg-black hover:text-primary transition-all flex items-center gap-3 shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
        <div className="shrink-0 border border-black group-hover:border-primary">
           <FlagIcon logoUrl={country.locationLogo} alt={country.name} className="h-6 w-8 object-cover block" />
        </div>
        <span className="font-bold text-sm uppercase leading-tight truncate">
          {country.name}
        </span>
      </div>
    </Link>
  );
}
