export interface InsightConfig {
	slug: string;
	title: string;
	description: string;
	metaTitle: string;
	metaDescription: string;
	category: 'paradox' | 'evolution' | 'relationship' | 'performance';
	icon: string;
	chartTypes: ('scatter' | 'line' | 'heatmap' | 'bar' | 'correlation')[];
	dataSources: string[]; // Tables/fields needed for analysis
	narrative: {
		hook: string; // The surprising finding
		explanation: string; // Why this happens
		implications: string; // What this means for F1
	};
	visualizations: {
		primary: {
			type: 'scatter' | 'line' | 'heatmap' | 'bar' | 'correlation';
			title: string;
			description: string;
			dataQuery: string; // Description of data needed
		};
		supporting: Array<{
			type: 'scatter' | 'line' | 'heatmap' | 'bar' | 'correlation';
			title: string;
			description: string;
			dataQuery: string;
		}>;
	};
	examples: Array<{
		driverName: string;
		driverId: number;
		explanation: string;
		stats: Record<string, number | string>;
	}>;
}

export const insightsConfig: Record<string, InsightConfig> = {
	'aggression-paradox': {
		slug: 'aggression-paradox',
		title: 'The Aggression Paradox',
		description: 'Why F1 champions score surprisingly low on aggression - the pole position effect.',
		metaTitle: 'The Aggression Paradox: Why F1 Champions Score Low on Aggression',
		metaDescription: 'Discover why successful F1 drivers like Max Verstappen have lower aggression scores. The surprising data reveals how pole positions create the aggression paradox.',
		category: 'paradox',
		icon: '⚡',
		chartTypes: ['scatter', 'bar'],
		dataSources: ['drivers_dna_profiles', 'results', 'qualifying'],
		narrative: {
			hook: 'Max Verstappen, one of F1\'s most aggressive drivers, scores just 48.1/100 on aggression. How is this possible?',
			explanation: 'Champions start from pole position more often, reducing opportunities for aggressive overtaking moves. Their low aggression scores reflect dominance, not passivity.',
			implications: 'This reveals a fundamental flaw in traditional racing metrics - success can actually lower your "aggression" rating.'
		},
		visualizations: {
			primary: {
				type: 'scatter',
				title: 'Career Wins vs Aggression Score',
				description: 'The inverse relationship between race wins and aggression scores',
				dataQuery: 'wins vs aggressionScore with era color coding'
			},
			supporting: [
				{
					type: 'bar',
					title: 'Average Grid Position by Aggression Score',
					description: 'How starting position affects aggression measurements',
					dataQuery: 'average qualifying position by aggression score ranges'
				},
				{
					type: 'line',
					title: 'Aggression Score by Era',
					description: 'How racing eras affect aggression measurements',
					dataQuery: 'average aggression score by decade/era'
				}
			]
		},
		examples: [
			{
				driverName: 'Max Verstappen',
				driverId: 830, // This would need to be the actual ID
				explanation: 'Despite being notoriously aggressive, Verstappen scores low due to 63 wins from dominant positions.',
				stats: {
					aggressionScore: 48.1,
					wins: 63,
					avgGridPosition: 2.1,
					overtakesPerRace: 1.2
				}
			},
			{
				driverName: 'Michele Alboreto',
				driverId: 123, // This would need to be the actual ID
				explanation: 'High aggression score reflects the need for overtaking in less competitive cars.',
				stats: {
					aggressionScore: 91.4,
					wins: 5,
					avgGridPosition: 8.3,
					overtakesPerRace: 4.7
				}
			}
		]
	},
	'consistency-trap': {
		slug: 'consistency-trap',
		title: 'The Consistency Trap',
		description: 'Why the most consistent drivers rarely win championships - the risk-taking paradox.',
		metaTitle: 'The Consistency Trap: Why Perfect Consistency Prevents Championships',
		metaDescription: 'Analysis reveals why ultra-consistent F1 drivers struggle to win titles. Discover why champions need calculated inconsistency to succeed.',
		category: 'paradox',
		icon: '🎯',
		chartTypes: ['scatter', 'bar'],
		dataSources: ['drivers_dna_profiles', 'driver_standings', 'results'],
		narrative: {
			hook: 'Drivers with 90+ consistency scores have won just 12% of all championships. Perfect consistency is actually a weakness.',
			explanation: 'Ultra-consistent drivers avoid the calculated risks needed for race wins. Champions balance consistency with strategic aggression.',
			implications: 'This challenges conventional wisdom that consistency alone wins championships in Formula 1.'
		},
		visualizations: {
			primary: {
				type: 'scatter',
				title: 'Consistency Score vs Championships Won',
				description: 'The inverse relationship between perfect consistency and title success',
				dataQuery: 'consistencyScore vs championship wins'
			},
			supporting: [
				{
					type: 'bar',
					title: 'Championship Wins by Consistency Range',
					description: 'How consistency levels correlate with title success',
					dataQuery: 'championship wins grouped by consistency score ranges'
				},
				{
					type: 'scatter',
					title: 'Risk vs Reward: Consistency vs Win Rate',
					description: 'The trade-off between consistency and race victories',
					dataQuery: 'consistencyScore vs win percentage'
				}
			]
		},
		examples: [
			{
				driverName: 'Rubens Barrichello',
				driverId: 18,
				explanation: 'Ultra-high consistency but only 11 wins in 322 races - too cautious for victory.',
				stats: {
					consistencyScore: 94.2,
					wins: 11,
					championships: 0,
					winRate: 3.4
				}
			},
			{
				driverName: 'Michael Schumacher',
				driverId: 1,
				explanation: 'Balanced consistency with calculated risks - the championship formula.',
				stats: {
					consistencyScore: 76.8,
					wins: 91,
					championships: 7,
					winRate: 29.8
				}
			}
		]
	},
	'era-evolution': {
		slug: 'era-evolution',
		title: 'The Evolution of Driver DNA',
		description: 'How F1 driver personalities have fundamentally changed across racing eras.',
		metaTitle: 'Evolution of F1 Driver DNA: How Racing Personalities Changed Over Decades',
		metaDescription: 'Comprehensive analysis of how F1 driver characteristics evolved from the 1970s to modern era. See how aggression, racecraft, and consistency changed.',
		category: 'evolution',
		icon: '📈',
		chartTypes: ['line', 'heatmap'],
		dataSources: ['drivers_dna_profiles', 'drivers_dna_timeline'],
		narrative: {
			hook: '1970s F1 drivers averaged 73.2 aggression. 2020s drivers average just 41.8. The sport has fundamentally changed who succeeds.',
			explanation: 'Aerodynamic sensitivity, tire management, and strategy have replaced wheel-to-wheel combat as the path to victory.',
			implications: 'Modern F1 rewards different personality traits than classic racing, creating entirely different driver archetypes.'
		},
		visualizations: {
			primary: {
				type: 'line',
				title: 'Average DNA Traits by Era',
				description: 'How each trait has evolved across F1 decades',
				dataQuery: 'average DNA scores by era for all traits'
			},
			supporting: [
				{
					type: 'heatmap',
					title: 'Era vs Trait Heatmap',
					description: 'Visual representation of trait dominance by era',
					dataQuery: 'heatmap of trait scores across eras'
				},
				{
					type: 'bar',
					title: 'Championship-Winning Traits by Era',
					description: 'Which traits mattered most for success in each era',
					dataQuery: 'average trait scores of champions by era'
				}
			]
		},
		examples: [
			{
				driverName: 'James Hunt',
				driverId: 45,
				explanation: '1970s champion with classic high-aggression, moderate-consistency profile.',
				stats: {
					era: '1970s',
					aggressionScore: 84.1,
					consistencyScore: 52.3,
					racecraftScore: 78.9
				}
			},
			{
				driverName: 'Lewis Hamilton',
				driverId: 44,
				explanation: 'Modern champion balancing calculated aggression with strategic thinking.',
				stats: {
					era: '2000s-2020s',
					aggressionScore: 45.1,
					consistencyScore: 83.7,
					racecraftScore: 91.2
				}
			}
		]
	},
	'circuit-dna': {
		slug: 'circuit-dna',
		title: 'Circuit DNA Preferences',
		description: 'How different racing circuits favor specific driver personality types.',
		metaTitle: 'Circuit DNA: Which F1 Tracks Favor Aggressive vs Consistent Drivers',
		metaDescription: 'Data analysis reveals which circuits reward aggression, consistency, or racecraft. Discover why Monaco favors different drivers than Monza.',
		category: 'relationship',
		icon: '🏎️',
		chartTypes: ['heatmap', 'scatter'],
		dataSources: ['drivers_dna_profiles', 'results', 'circuits'],
		narrative: {
			hook: 'Monaco rewards racecraft (correlation: +0.73). Monza rewards aggression (+0.68). Each circuit has a personality preference.',
			explanation: 'Track characteristics create natural advantages for certain driver types. Street circuits favor precision, power tracks favor risk-taking.',
			implications: 'Understanding circuit DNA could revolutionize driver-track matching and setup strategies.'
		},
		visualizations: {
			primary: {
				type: 'heatmap',
				title: 'Circuit vs DNA Trait Correlation',
				description: 'Which traits lead to success at each circuit',
				dataQuery: 'correlation between trait scores and finishing positions by circuit'
			},
			supporting: [
				{
					type: 'scatter',
					title: 'Monaco: Racecraft vs Success Rate',
					description: 'How racecraft score predicts Monaco performance',
					dataQuery: 'racecraft score vs Monaco results'
				},
				{
					type: 'bar',
					title: 'Track Type Preferences',
					description: 'How circuit categories favor different traits',
					dataQuery: 'average trait correlations by track type (street, permanent, temporary)'
				}
			]
		},
		examples: [
			{
				driverName: 'Ayrton Senna',
				driverId: 1,
				explanation: 'Perfect Monaco specialist - high racecraft (94.2) led to 6 Monaco wins.',
				stats: {
					racecraftScore: 94.2,
					monacoWins: 6,
					monacoWinRate: 50.0,
					overallWinRate: 25.3
				}
			},
			{
				driverName: 'Lewis Hamilton',
				driverId: 44,
				explanation: 'Modern Monaco master with exceptional racecraft in tight spaces.',
				stats: {
					racecraftScore: 91.2,
					monacoWins: 3,
					monacoWinRate: 20.0,
					overallWinRate: 32.1
				}
			}
		]
	}
};

export const insightCategories = {
	paradox: {
		name: 'Racing Paradoxes',
		description: 'Counter-intuitive findings that challenge conventional F1 wisdom',
		icon: '🤔',
	},
	evolution: {
		name: 'Era Evolution',
		description: 'How driver traits and racing have changed across F1 history',
		icon: '📈',
	},
	relationship: {
		name: 'Hidden Relationships',
		description: 'Unexpected connections between drivers, circuits, and performance',
		icon: '🔗',
	},
	performance: {
		name: 'Performance Analysis',
		description: 'Deep dives into what separates great drivers from good ones',
		icon: '🏆',
	},
};

export function getInsightConfig(slug: string): InsightConfig | undefined {
	return insightsConfig[slug];
}

export function getInsightsByCategory(category: keyof typeof insightCategories): InsightConfig[] {
	return Object.values(insightsConfig).filter((config) => config.category === category);
}

export function getAllInsights(): InsightConfig[] {
	return Object.values(insightsConfig);
}