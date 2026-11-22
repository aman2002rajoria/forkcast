import type { Metadata, Viewport } from "next";
import { Fira_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav, Toast, TopBar } from "@/components/Shell";

const fira = Fira_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "800", "900"], variable: "--font", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--mono", display: "swap" });

export const metadata: Metadata = {
  title: "Forkcast",
  description: "Rate the dish, not the restaurant. Say what you feel like, see what will actually arrive.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#FAFAFB" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fira.variable} ${mono.variable}`}>
      <body>
        <StoreProvider>
          <TopBar />
          <Nav />
          <main className="pb-[calc(var(--tabbar-h)+56px)]">{children}</main>
          <Toast />
        </StoreProvider>
      </body>
    </html>
  );
}
