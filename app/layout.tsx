import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: "Personal Vault",
  description: "Google Material Design file browser for personal vault",
  manifest: "/manifest.json",
  themeColor: "#1976d2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Personal Vault",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Personal Vault" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="msapplication-TileColor" content="#1976d2" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body className={`${inter.className} ${roboto.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
