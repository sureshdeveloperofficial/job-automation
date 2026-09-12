import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'AI Career OS — Find Your Best Jobs',
  description:
    'AI Career OS is a complete career automation platform. Find the right jobs, prepare the strongest evidence-backed application, and track outcomes.',
  keywords: ['job search', 'career intelligence', 'resume optimization', 'AI jobs', 'job matching'],
  openGraph: {
    title: 'AI Career OS',
    description: 'Find the right jobs with AI-powered career intelligence',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
