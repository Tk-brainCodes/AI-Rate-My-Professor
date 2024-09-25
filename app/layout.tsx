import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Poppins } from "next/font/google";

export const poppins = Poppins({ subsets: ["latin"], weight: "400" });
import "./globals.css";

export const metadata: Metadata = {
  title: "Rate my professor",
  description:
    "Generate personalized rating of professor by interacting with ai chatbot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <body
          className={`${poppins.className} w-full h-full bg-white dark:bg-[#171717]`}
        >
          {children}
        </body>
      </ThemeProvider>
    </html>
  );
}
