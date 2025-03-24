import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weights: ["200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Real Life Among Us",
  description: "Real Lige Among Us chat app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>{children}</body>
    </html>
  );
}
