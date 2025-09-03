import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { MobileNav } from '@/components/MobileNav';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Racing Decoded - F1 Driver DNA Analysis',
	description: 'Analyze F1 driver personality traits through data',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<meta name='apple-mobile-web-app-title' content='RD' />
				<script defer data-website-id='68b79f911a49c66777e60bf9' data-domain='racingdecoded.com' src='https://datafa.st/js/script.js'></script>
			</head>
			<body className={inter.className}>
				<ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
					<ReactQueryProvider>
						<NuqsAdapter>
							<div className='min-h-screen bg-background'>
								<MobileNav />
								<main className='container mx-auto px-4 py-8'>{children}</main>
							</div>
						</NuqsAdapter>
					</ReactQueryProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
