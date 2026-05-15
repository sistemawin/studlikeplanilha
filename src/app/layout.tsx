import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Studlike | Plano de estudos",
  description: "Dashboard para edital verticalizado, cronograma, revisões e simulados.",
  manifest: "/manifest.json",
  icons: {
    icon: "/studlike-logo.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Studlike",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-hidden`}>
      <body className="flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden">{children}</body>
    </html>
  );
}
