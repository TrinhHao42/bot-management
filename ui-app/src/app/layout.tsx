import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";

import { ToastProvider } from "@/context/ToastContext";

const urbanist = Urbanist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stitch Bot Manager",
  description: "Microkernel Bot Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${urbanist.className} h-screen w-screen overflow-hidden bg-[#031427]`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
