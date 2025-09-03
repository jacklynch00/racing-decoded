import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getInsightConfig } from '@/lib/insights-config';
import { InsightPageClient } from '@/components/insights/InsightPageClient';

interface InsightPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InsightPageProps): Promise<Metadata> {
	const { slug } = await params;
	const config = getInsightConfig(slug);

	if (!config) {
		return {
			title: 'Insight Not Found - Racing Decoded',
		};
	}

	return {
		title: config.metaTitle,
		description: config.metaDescription,
		openGraph: {
			title: config.metaTitle,
			description: config.metaDescription,
			type: 'article',
		},
		twitter: {
			card: 'summary_large_image',
			title: config.metaTitle,
			description: config.metaDescription,
		},
	};
}

export default async function InsightPage({ params }: InsightPageProps) {
	const { slug } = await params;
	const config = getInsightConfig(slug);

	if (!config) {
		notFound();
	}

	return (
		<div className='space-y-8'>
			{/* Hero Section */}
			<div className='text-center space-y-4 max-w-4xl mx-auto'>
				<div className='flex items-center justify-center gap-3 mb-4'>
					<span className='text-4xl'>{config.icon}</span>
					<h1 className='text-3xl md:text-4xl font-bold'>{config.title}</h1>
				</div>
				<p className='text-lg text-muted-foreground'>
					{config.description}
				</p>
			</div>

			{/* The Hook */}
			<div className='bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-6 max-w-4xl mx-auto'>
				<div className='text-center space-y-2'>
					<p className='text-sm font-medium text-muted-foreground uppercase tracking-wide'>The Insight</p>
					<p className='text-xl md:text-2xl font-bold text-primary'>
						{config.narrative.hook}
					</p>
				</div>
			</div>

			<Suspense fallback={
				<div className='text-center py-8'>
					<p className='text-muted-foreground'>Loading insight data...</p>
				</div>
			}>
				<InsightPageClient config={config} />
			</Suspense>
		</div>
	);
}