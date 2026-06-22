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
  title: "Sentinel | Cyber Attack Simulation Platform",
  description: "Visualize, simulate, and defend against advanced persistent threats in a cinematic digital twin environment. Sentinel maps threat campaigns to MITRE ATT&CK and generates predictive playbooks before they impact your network.",
  keywords: ["cybersecurity", "AI simulation", "cyber warfare", "digital twin", "threat modeling", "MITRE ATT&CK", "automated defense"],
  authors: [{ name: "Sentinel Engineering" }],
  openGraph: {
    title: "Sentinel | Cyber Attack Simulation Platform",
    description: "Visualize and simulate advanced cyber threats before they strike.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="bg-cyber-bg text-slate-100 font-sans antialiased min-h-screen selection:bg-electric-blue/30 selection:text-white relative">
        {/* Global Monitor CRT Filter Overlays */}
        {/* Subtle horizontal scanline mesh pattern */}
        <div className="fixed inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-[0.03]" />

        {/* Slow vertical sweeping scanline beam */}
        <div className="fixed inset-0 pointer-events-none z-50 animate-scanline bg-gradient-to-b from-transparent via-cyber-cyan/[0.012] to-transparent h-16 w-full" />

        {children}
      </body>
    </html>
  );
}
