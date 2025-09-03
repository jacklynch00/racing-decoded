import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/lib/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
		<html lang='en'>
			<head>
				<script defer data-website-id='68b79f911a49c66777e60bf9' data-domain='racingdecoded.com' src='https://datafa.st/js/script.js'></script>
			</head>
			<body className={inter.className}>
				<ReactQueryProvider>
					<div className='min-h-screen bg-background'>
						<header className='border-b'>
							<div className='container mx-auto px-4 py-4'>
								<div className='flex justify-between items-center'>
									<div>
										<h1 className='text-2xl font-bold'>Racing Decoded</h1>
										<p className='text-muted-foreground'>F1 Driver DNA Analysis</p>
									</div>
									<nav className='flex items-center gap-4'>
										<Link href='/'>
											<Button variant='ghost'>Drivers</Button>
										</Link>
										<Link href='/track-animation'>
											<Button variant='ghost'>Track Animation</Button>
										</Link>
									</nav>
								</div>
							</div>
						</header>
						<main className='container mx-auto px-4 py-8'>{children}</main>
					</div>
				</ReactQueryProvider>
			</body>
		</html>
	);
}
