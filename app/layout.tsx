import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luna Grounding Auditor",
  description: "Certify what an AI agent can actually see before deployment."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
