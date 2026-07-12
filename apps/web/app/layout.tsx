import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JNLOP — Jubilee Nation Leadership & Operations",
  description: "JNIC internal operations platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
