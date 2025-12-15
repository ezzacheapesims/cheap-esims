import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 py-16 px-4">
      <div className="h-24 w-24 rounded-full bg-primary flex items-center justify-center border-2 border-black shadow-hard-sm">
        <CheckCircle2 className="h-12 w-12 text-black" />
      </div>
      
      <div className="space-y-4 max-w-lg">
        <h1 className="text-5xl font-black text-black uppercase tracking-tighter leading-none">
          Payment<br/>Successful!
        </h1>
        <p className="text-gray-600 font-mono font-bold uppercase text-sm border-2 border-black p-4 bg-white shadow-hard-sm">
          Your eSIM order has been confirmed. You will receive an email with installation instructions shortly.
        </p>
      </div>

      <Link href="/my-esims">
        <Button className="h-16 px-10 text-xl font-black uppercase bg-black text-white border-2 border-black hover:bg-white hover:text-black shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all rounded-none">
          View My eSIMs
        </Button>
      </Link>
    </div>
  );
}
