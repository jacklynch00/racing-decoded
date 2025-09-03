import { Metadata } from 'next';
import { CircuitsRankingsClient } from '@/components/rankings/CircuitsRankingsClient';

export const metadata: Metadata = {
	title: 'F1 Circuit Masters - Track-Specific Driver Rankings | Racing Decoded',
	description:
		'Discover which F1 drivers dominate specific circuits. Complete rankings for Monaco, Silverstone, Monza, Spa-Francorchamps and more iconic Formula 1 venues.',
	keywords: [
		'F1 circuit masters',
		'Monaco Grand Prix winners',
		'Silverstone F1 winners',
		'Monza race winners',
		'Spa-Francorchamps masters',
		'F1 track specialists',
		'Formula 1 circuit rankings',
		'F1 venue analysis',
	],
	openGraph: {
		title: 'F1 Circuit Masters - Track-Specific Driver Rankings',
		description: 'Discover which F1 drivers dominate specific circuits like Monaco, Silverstone, Monza, and Spa-Francorchamps.',
		type: 'website',
		images: [
			{
				url: '/og-circuit-rankings.jpg',
				width: 1200,
				height: 630,
				alt: 'F1 Circuit Masters Rankings',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'F1 Circuit Masters - Track-Specific Driver Rankings',
		description: 'Discover which F1 drivers dominate specific circuits like Monaco, Silverstone, Monza, and Spa-Francorchamps.',
	},
};

export default function CircuitsRankingsPage() {
	return <CircuitsRankingsClient />;
}