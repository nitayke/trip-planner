import type { Metadata, Viewport } from "next";
import { Rubik, Secular_One } from "next/font/google";
import "./globals.css";
import { PasswordGate } from "../components/PasswordGate";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rubik",
});

const secular = Secular_One({
  subsets: ["hebrew", "latin"],
  weight: "400",
  variable: "--font-secular",
});

export const metadata: Metadata = {
  title: "הטיול שלנו ✈️",
  description: "תכנון הטיול הזוגי: מסלול יומי, טיסות, לינה, תקציב ועוזר AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "הטיול שלנו",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${rubik.variable} ${secular.variable} h-full antialiased`}>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✈️</text></svg>" />
      </head>
      <body className="min-h-full flex flex-col font-sans text-stone-900 selection:bg-teal-100 selection:text-teal-900">
        <PasswordGate>{children}</PasswordGate>
      </body>
    </html>
  );
}
