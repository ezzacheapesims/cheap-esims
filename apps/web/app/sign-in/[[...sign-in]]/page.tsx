import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] bg-primary/10 px-4 py-10">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            variables: {
              colorPrimary: "#000000",
              colorBackground: "#ffffff",
              colorInputBackground: "#ffffff",
              colorInputText: "#111827",
              colorText: "#000000",
              colorTextSecondary: "#4b5563",
              borderRadius: "0.5rem",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
            },
            elements: {
              rootBox: "w-full",
              card: "bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] px-6 py-8",
              headerTitle:
                "text-3xl font-black uppercase tracking-tight text-black mb-2",
              headerSubtitle:
                "text-gray-700 font-mono text-xs uppercase tracking-wide mb-4",
              socialButtonsBlockButton:
                "bg-white border-2 border-black text-black font-bold uppercase tracking-wide shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all",
              socialButtonsBlockButtonText: "text-black font-bold",
              formButtonPrimary:
                "bg-primary text-black font-black uppercase tracking-wide border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-lime-300 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all",
              formFieldInput:
                "bg-white border-2 border-black text-black placeholder:text-gray-500 rounded-none focus:outline-none focus:ring-0 focus:border-black",
              formFieldLabel:
                "font-mono text-xs uppercase tracking-wide text-gray-700 mb-1",
              dividerLine: "bg-black",
              dividerText:
                "font-mono text-[10px] uppercase tracking-[0.15em] text-gray-600",
              footerAction__signIn:
                "font-mono text-xs uppercase text-gray-700",
              footerActionLink:
                "font-mono text-xs uppercase text-black underline underline-offset-4",
              identityPreviewText: "text-gray-800",
              identityPreviewEditButton:
                "text-black font-mono text-xs uppercase underline",
              formResendCodeLink:
                "text-black font-mono text-xs uppercase underline",
              alert:
                "bg-red-50 border-2 border-black text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
              alertText: "text-black text-sm",
            },
          }}
        />
      </div>
    </div>
  );
}
