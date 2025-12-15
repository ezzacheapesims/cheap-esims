import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="h-20 w-20 rounded-full bg-red-100 border-2 border-black flex items-center justify-center shadow-hard-sm">
        <XCircle className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-4xl font-black uppercase text-black">Payment Cancelled</h1>
      <p className="text-gray-600 font-mono font-bold uppercase text-sm max-w-md">
        Your payment was cancelled. You have not been charged. You can try again whenever you're ready.
      </p>
      <Link href="/">
        <Button className="bg-white border-2 border-black text-black font-black uppercase hover:bg-black hover:text-white px-8 py-6 text-lg rounded-none shadow-hard hover:shadow-none transition-all">
          Return to Store
        </Button>
      </Link>
    </div>
  );
}
