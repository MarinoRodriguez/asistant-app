import type { Metadata } from "next";
import Link from 'next/link';
import "./globals.css";

export const metadata: Metadata = {
  title: "Attendance App",
  description: "Simple attendance tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav style={{ marginBottom: "1rem" }}>
          <Link href="/people">People</Link> | {" "}
          <Link href="/sessions">Sessions</Link> | {" "}
          <Link href="/reports">Reports</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
