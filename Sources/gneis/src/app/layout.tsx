import type { Metadata } from "next";
import { Roboto } from "next/font/google";

import CustomHeadImports from '@/app/head'

import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visualizador GNEIS",
  description: "Visualizador del IGN-CNIG para...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${roboto.variable} h-full antialiased`}
    >
      <head>
        <CustomHeadImports/>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}