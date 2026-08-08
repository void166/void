import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollFX from "@/components/ScrollFX";
import SplashScreen from "@/components/SplashScreen";
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
  title: {
    default: "Renchin | Full-Stack Developer",
    template: "%s | Renchin",
  },
  description:
    "Portfolio of Renchin — a full-stack developer from Ulaanbaatar building fast, expressive web products with React, Node.js, and Three.js.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-paper">
        <SplashScreen />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* scroll progress bar + site-wide scroll reveals */}
        <ScrollFX />
        {/* CRT texture over everything */}
        <div className="scanlines-fixed" aria-hidden />
      </body>
    </html>
  );
}
