export interface RankingConfig {
	slug: string;
	title: string;
	description: string;
	metaTitle: string;
	metaDescription: string;
	sortField: string;
	sortOrder: 'asc' | 'desc';
	category: 'dna' | 'career' | 'circuit' | 'era';
	unit?: string;
	filters?: Record<string, unknown>;
	customQuery?: boolean; // For complex rankings that need custom API logic
}

export const rankingsConfig: Record<string, RankingConfig> = {
	// DNA Attribute Rankings
	'most-aggressive': {
		slug: 'most-aggressive',
		title: 'Most Aggressive F1 Drivers',
		description: 'Ranking F1 drivers by their aggression score based on overtaking, defending, and racing style analysis.',
		metaTitle: 'Most Aggressive F1 Drivers of All Time - Racing DNA Rankings',
		metaDescription:
			'Discover which F1 drivers are the most aggressive on track. Our data-driven analysis ranks drivers by aggression score based on overtaking patterns and racing style.',
		sortField: 'aggressionScore',
		sortOrder: 'desc',
		category: 'dna',
		unit: '/100',
	},
	'most-consistent': {
		slug: 'most-consistent',
		title: 'Most Consistent F1 Drivers',
		description: 'F1 drivers ranked by consistency score, measuring reliability and predictable performance across races.',
		metaTitle: 'Most Consistent F1 Drivers - Reliability Rankings | Racing Decoded',
		metaDescription: 'Which F1 drivers deliver the most consistent performance? See our data-driven ranking of the most reliable drivers in Formula 1 history.',
		sortField: 'consistencyScore',
		sortOrder: 'desc',
		category: 'dna',
		unit: '/100',
	},
	'best-racecraft': {
		slug: 'best-racecraft',
		title: 'Best Racecraft F1 Drivers',
		description: 'Drivers with the best racecraft skills including wheel-to-wheel racing, strategic thinking, and race management.',
		metaTitle: 'F1 Drivers with Best Racecraft Skills - Racing Intelligence Rankings',
		metaDescription: 'Discover F1 drivers with exceptional racecraft abilities. Our analysis ranks drivers by race management, strategy, and wheel-to-wheel combat skills.',
		sortField: 'racecraftScore',
		sortOrder: 'desc',
		category: 'dna',
		unit: '/100',
	},
	'best-under-pressure': {
		slug: 'best-under-pressure',
		title: 'F1 Drivers Who Perform Best Under Pressure',
		description: 'Ranking drivers by their ability to perform when it matters most - in qualifying, championship fights, and crucial moments.',
		metaTitle: 'F1 Drivers Best Under Pressure - Clutch Performance Rankings',
		metaDescription: 'Which F1 drivers thrive under pressure? See our ranking of drivers who deliver when stakes are highest, based on performance analysis.',
		sortField: 'pressurePerformanceScore',
		sortOrder: 'desc',
		category: 'dna',
		unit: '/100',
	},
	'best-race-start': {
		slug: 'best-race-start',
		title: 'Best Race Starters in F1',
		description: 'F1 drivers with the best race starts, ranked by their ability to gain positions from lights to first corner.',
		metaTitle: 'Best F1 Race Starters - Launch Performance Rankings',
		metaDescription: 'Who are the best race starters in F1? Our data analysis ranks drivers by their ability to gain positions at race starts.',
		sortField: 'raceStartScore',
		sortOrder: 'desc',
		category: 'dna',
		unit: '/100',
	},

	// Career Achievement Rankings
	'most-wins': {
		slug: 'most-wins',
		title: 'Most F1 Race Wins',
		description: 'F1 drivers ranked by total number of Grand Prix victories throughout their careers.',
		metaTitle: 'F1 Drivers with Most Race Wins - All Time Victory Rankings',
		metaDescription: 'Complete ranking of F1 drivers by race wins. See who has won the most Formula 1 Grand Prix races in history.',
		sortField: 'wins',
		sortOrder: 'desc',
		category: 'career',
		unit: ' wins',
	},
	'most-podiums': {
		slug: 'most-podiums',
		title: 'Most F1 Podium Finishes',
		description: 'F1 drivers with the most podium finishes (1st, 2nd, and 3rd place) in their careers.',
		metaTitle: 'F1 Drivers with Most Podiums - Top 3 Finish Rankings',
		metaDescription: 'Which F1 drivers have achieved the most podium finishes? Complete ranking of drivers by total podium appearances.',
		sortField: 'podiums',
		sortOrder: 'desc',
		category: 'career',
		unit: ' podiums',
	},
	'best-average-finish': {
		slug: 'best-average-finish',
		title: 'Best Average Finish Position in F1',
		description: 'F1 drivers ranked by their average finishing position across all races in their careers.',
		metaTitle: 'Best Average F1 Finish Position - Consistency Rankings',
		metaDescription: 'Which F1 drivers have the best average finishing positions? See rankings based on consistent performance across careers.',
		sortField: 'avgFinishPosition',
		sortOrder: 'asc',
		category: 'career',
		unit: ' avg',
	},
	'most-races': {
		slug: 'most-races',
		title: 'Most F1 Races Competed',
		description: 'F1 drivers who have competed in the most Grand Prix races throughout their careers.',
		metaTitle: 'F1 Drivers with Most Race Starts - Longevity Rankings',
		metaDescription: 'Which F1 drivers have competed in the most races? Rankings by total Grand Prix starts and career longevity.',
		sortField: 'totalRaces',
		sortOrder: 'desc',
		category: 'career',
		unit: ' races',
	},
	'best-championship-finish': {
		slug: 'best-championship-finish',
		title: 'Best Championship Finishes in F1',
		description: 'F1 drivers ranked by their best championship finishing position throughout their careers.',
		metaTitle: 'Best F1 Championship Finishes - Title Contender Rankings',
		metaDescription: 'Which F1 drivers achieved the best championship results? Rankings by highest championship finishing positions.',
		sortField: 'bestChampionshipFinish',
		sortOrder: 'asc',
		category: 'career',
		unit: ' position',
	},

	'most-wins-monaco': {
		slug: 'most-wins-monaco',
		title: 'Most Wins at Monaco Grand Prix',
		description: 'F1 drivers with the most victories at the prestigious Monaco Grand Prix, the crown jewel of Formula 1.',
		metaTitle: 'Most Monaco Grand Prix Wins - F1 Monaco Masters | Racing Decoded',
		metaDescription: 'Which F1 drivers have won the most Monaco Grand Prix races? Complete ranking of Monaco specialists and street circuit masters.',
		sortField: 'wins',
		sortOrder: 'desc',
		category: 'circuit',
		unit: ' wins',
		filters: { circuitRef: 'monaco' },
		customQuery: true,
	},
	'most-wins-silverstone': {
		slug: 'most-wins-silverstone',
		title: 'Most Wins at Silverstone',
		description: 'F1 drivers with the most victories at Silverstone Circuit, home of the British Grand Prix.',
		metaTitle: 'Most Silverstone Wins - British Grand Prix Masters | Racing Decoded',
		metaDescription: 'Which F1 drivers have dominated Silverstone? Rankings of the most successful drivers at the home of British motorsport.',
		sortField: 'wins',
		sortOrder: 'desc',
		category: 'circuit',
		unit: ' wins',
		filters: { circuitRef: 'silverstone' },
		customQuery: true,
	},
	'most-wins-monza': {
		slug: 'most-wins-monza',
		title: 'Most Wins at Monza',
		description: 'F1 drivers with the most victories at Autodromo Nazionale Monza, the Temple of Speed.',
		metaTitle: 'Most Monza Wins - Italian Grand Prix Kings | Racing Decoded',
		metaDescription: 'Which F1 drivers have conquered the Temple of Speed? Complete ranking of Monza masters and Italian Grand Prix winners.',
		sortField: 'wins',
		sortOrder: 'desc',
		category: 'circuit',
		unit: ' wins',
		filters: { circuitRef: 'monza' },
		customQuery: true,
	},
	'most-wins-spa': {
		slug: 'most-wins-spa',
		title: 'Most Wins at Spa-Francorchamps',
		description: 'F1 drivers with the most victories at Circuit de Spa-Francorchamps, the legendary Belgian circuit.',
		metaTitle: 'Most Spa-Francorchamps Wins - Belgian Grand Prix Legends',
		metaDescription: 'Which F1 drivers have mastered Spa-Francorchamps? Rankings of the most successful drivers at the legendary Belgian circuit.',
		sortField: 'wins',
		sortOrder: 'desc',
		category: 'circuit',
		unit: ' wins',
		filters: { circuitRef: 'spa' },
		customQuery: true,
	},
	'most-wins-interlagos': {
		slug: 'most-wins-interlagos',
		title: 'Most Wins at Interlagos',
		description: 'F1 drivers with the most victories at Autódromo José Carlos Pace (Interlagos), home of the Brazilian Grand Prix.',
		metaTitle: 'Most Interlagos Wins - Brazilian Grand Prix Champions',
		metaDescription: 'Which F1 drivers have triumphed at Interlagos? Complete ranking of Brazilian Grand Prix winners and Sao Paulo masters.',
		sortField: 'wins',
		sortOrder: 'desc',
		category: 'circuit',
		unit: ' wins',
		filters: { circuitRef: 'interlagos' },
		customQuery: true,
	},
	'most-wins-suzuka': {
		slug: 'most-wins-suzuka',
		title: 'Most Wins at Suzuka',
		description: 'F1 drivers with the most victories at Suzuka Circuit, home of the Japanese Grand Prix.',
		metaTitle: 'Most Suzuka Wins - Japanese Grand Prix Masters',
		metaDescription: 'Which F1 drivers have conquered Suzuka Circuit? Rankings of the most successful drivers at the challenging Japanese venue.',
		sortField: 'wins',
		sortOrder: 'desc',
		category: 'circuit',
		unit: ' wins',
		filters: { circuitRef: 'suzuka' },
		customQuery: true,
	},
};

export const rankingCategories = {
	dna: {
		name: 'Driver DNA',
		description: 'Rankings based on driving personality traits and behavioral analysis',
	},
	career: {
		name: 'Career Achievements',
		description: 'Rankings based on career statistics and accomplishments',
	},
	circuit: {
		name: 'Circuit Masters',
		description: 'Rankings for performance at specific race tracks',
	},
};

export function getRankingConfig(slug: string): RankingConfig | undefined {
	return rankingsConfig[slug];
}

export function getRankingsByCategory(category: keyof typeof rankingCategories): RankingConfig[] {
	return Object.values(rankingsConfig).filter((config) => config.category === category);
}

export function getAllRankings(): RankingConfig[] {
	return Object.values(rankingsConfig);
}
