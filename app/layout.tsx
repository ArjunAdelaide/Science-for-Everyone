import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EzResearch",
  description: "Academic research intelligence for transparent biomedical evidence synthesis."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
