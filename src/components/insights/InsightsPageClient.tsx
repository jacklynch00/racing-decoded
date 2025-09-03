'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { getAllInsights, getInsightsByCategory, insightCategories } from '@/lib/insights-config';
import { TrendingUp, Lightbulb, AlertTriangle, BarChart3 } from 'lucide-react';

const categoryIcons = {
	paradox: AlertTriangle,
	evolution: TrendingUp,
	relationship: Lightbulb,
	performance: BarChart3,
};

export function InsightsPageClient() {
	const allInsights = getAllInsights();

	const getCategoryIcon = (category: keyof typeof insightCategories) => {
		const IconComponent = categoryIcons[category];
		return <IconComponent className='h-5 w-5' />;
	};

	return (
		<div className='space-y-8'>
			{/* All Insights */}
			<div className='space-y-6'>
				<div className='flex items-center gap-2'>
					<Lightbulb className='h-6 w-6 text-yellow-500' />
					<h2 className='text-2xl font-bold'>All Insights</h2>
				</div>

				<div className='grid gap-6'>
					{allInsights.map((insight) => (
						<Link key={insight.slug} href={`/insights/${insight.slug}`}>
							<Card className='cursor-pointer transition-all hover:shadow-lg border-l-4 border-l-transparent hover:border-l-primary'>
								<CardHeader>
									<div className='flex items-start justify-between gap-4'>
										<div className='space-y-2 flex-1'>
											<div className='flex items-center gap-3'>
												<span className='text-2xl'>{insight.icon}</span>
												<div>
													<CardTitle className='text-xl hover:text-primary transition-colors'>
														{insight.title}
													</CardTitle>
													<div className='flex items-center gap-2 mt-1'>
														<Badge variant='outline' className='text-xs'>
															{insightCategories[insight.category].name}
														</Badge>
														<div className='flex gap-1'>
															{insight.chartTypes.map((chartType) => (
																<Badge key={chartType} variant='secondary' className='text-xs capitalize'>
																	{chartType}
																</Badge>
															))}
														</div>
													</div>
												</div>
											</div>
											<CardDescription className='text-base leading-relaxed'>
												{insight.description}
											</CardDescription>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className='p-3 bg-muted/50 rounded-lg'>
										<p className='text-sm italic'>&ldquo;{insight.narrative.hook}&rdquo;</p>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}