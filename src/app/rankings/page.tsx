import { Metadata } from 'next';
import { RankingsClient } from '@/components/rankings/RankingsClient';

export const metadata: Metadata = {
	title: 'F1 Driver Rankings - Complete Performance Analysis | Racing Decoded',
	description:
		'Comprehensive F1 driver rankings across DNA traits, career achievements, and performance metrics. Discover top performers in aggression, consistency, wins, and more.',
	keywords: [
		'F1 driver rankings',
		'Formula 1 driver analysis',
		'F1 performance metrics',
		'driver DNA analysis',
		'F1 career statistics',
		'Formula 1 leaderboards',
		'racing driver rankings',
		'F1 data analysis',
	],
	openGraph: {
		title: 'F1 Driver Rankings - Complete Performance Analysis',
		description: 'Comprehensive F1 driver rankings across DNA traits, career achievements, and performance metrics.',
		type: 'website',
		images: [
			{
				url: '/og-rankings.jpg', // You'll need to create this image
				width: 1200,
				height: 630,
				alt: 'F1 Driver Rankings',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'F1 Driver Rankings - Complete Performance Analysis',
		description: 'Comprehensive F1 driver rankings across DNA traits, career achievements, and performance metrics.',
	},
};

export default function RankingsPage() {
	return <RankingsClient />;
}
