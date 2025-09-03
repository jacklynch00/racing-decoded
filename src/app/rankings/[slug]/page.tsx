import { Metadata } from 'next';
import { getRankingConfig } from '@/lib/rankings-config';
import { RankingPageClient } from '@/components/rankings/RankingPageClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
	const { slug } = await params;
	const ranking = getRankingConfig(slug);

	if (!ranking) {
		return {
			title: 'Ranking Not Found | Racing Decoded',
			description: 'The requested F1 driver ranking could not be found.'
		};
	}

	return {
		title: ranking.metaTitle,
		description: ranking.metaDescription,
		keywords: [
			ranking.title.toLowerCase(),
			`F1 ${ranking.sortField}`,
			'Formula 1 rankings',
			'driver analysis',
			'F1 statistics',
			ranking.category === 'dna' ? 'driver DNA' : 'career achievements',
			'racing performance'
		],
		openGraph: {
			title: ranking.metaTitle,
			description: ranking.metaDescription,
			type: 'website',
			images: [
				{
					url: `/og-ranking-${slug}.jpg`, // Dynamic OG images per ranking
					width: 1200,
					height: 630,
					alt: ranking.title
				}
			]
		},
		twitter: {
			card: 'summary_large_image',
			title: ranking.metaTitle,
			description: ranking.metaDescription
		}
	};
}

export default function RankingPage() {
	return <RankingPageClient />;
}