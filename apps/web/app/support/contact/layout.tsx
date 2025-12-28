import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support - Cheap eSIMs",
  description: "Contact Cheap eSIMs support team for help with orders, installation issues, or questions about our eSIM services.",
  openGraph: {
    title: "Contact Support - Cheap eSIMs",
    description: "Contact our support team for assistance with your eSIM needs.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


