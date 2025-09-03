import { Badge } from '@/components/ui/badge';

interface DNAScoreBadgeProps {
	label: string;
	score: number | null;
}

export function DNAScoreBadge({ label, score }: DNAScoreBadgeProps) {
	if (score === null) {
		return (
			<Badge variant='secondary'>
				{label}: N/A
			</Badge>
		);
	}

	const getBadgeProps = (value: number) => {
		if (value >= 70) {
			return {
				variant: 'outline' as const,
				className: 'border-green-500 bg-green-50 text-green-800 dark:border-green-400 dark:bg-green-950 dark:text-green-300'
			};
		}
		if (value >= 50) {
			return {
				variant: 'outline' as const,
				className: 'border-blue-500 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
			};
		}
		return {
			variant: 'outline' as const,
			className: 'border-yellow-500 bg-yellow-50 text-yellow-800 dark:border-yellow-400 dark:bg-yellow-950 dark:text-yellow-300'
		};
	};

	const { variant, className } = getBadgeProps(score);

	return (
		<Badge variant={variant} className={className}>
			{label}: {score.toFixed(1)}
		</Badge>
	);
}