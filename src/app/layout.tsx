import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeInitScript } from "@/components/ThemeInitScript";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.GITHUB_PAGES
  ? "https://takehomecomp.in"
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Takehome Comp | India salary estimates after tax",
  description:
    "Independent tool: LeetCode Discuss compensation posts with estimated monthly net pay after tax, PF, and deductions. Not affiliated with LeetCode.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Takehome Comp",
    description:
      "Estimated take-home pay for India tech offers shared on LeetCode Discuss.",
    type: "website",
  },
  icons: {
    icon: [
      { url: "icon.png", type: "image/png", sizes: "64x64" },
      { url: "icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "icon.png", type: "image/png", sizes: "64x64" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <head>
        <ThemeInitScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
