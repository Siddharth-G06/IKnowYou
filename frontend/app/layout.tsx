import "./globals.css";
import { Inter } from "next/font/google";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "IKnowYou — Personal Relationship Memory",
  description: "Know everyone better. Your personal relationship intelligence system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}
      >
        <div className="relative flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1 container max-w-screen-xl mx-auto px-4 md:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
