import { Metadata } from 'next';
import { Suspense } from 'react';
import { InsightsPageClient } from '@/components/insights/InsightsPageClient';

export const metadata: Metadata = {
	title: 'F1 Data Insights - Racing Decoded',
	description: 'Discover hidden patterns and surprising insights from Formula 1 data analysis. Explore racing paradoxes, driver evolution, and performance secrets.',
};

export default function InsightsPage() {
	return (
		<div className='space-y-8'>
			<div className='text-center space-y-4'>
				<h1 className='text-3xl md:text-4xl font-bold'>F1 Data Insights</h1>
				<p className='text-lg text-muted-foreground max-w-3xl mx-auto'>
					Discover hidden patterns and surprising truths in Formula 1 data. Our analysis reveals counter-intuitive insights that challenge conventional racing wisdom.
				</p>
			</div>

			<Suspense fallback={
				<div className='text-center py-8'>
					<p className='text-muted-foreground'>Loading insights...</p>
				</div>
			}>
				<InsightsPageClient />
			</Suspense>
		</div>
	);
}