'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { getAllInsights } from '@/lib/insights-config';

export function InsightsPageClient() {
	const allInsights = getAllInsights();

	return (
		<div className='space-y-8'>
			{/* All Insights */}
			<div className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6'>
					{allInsights.map((insight) => (
						<Link key={insight.slug} href={`/insights/${insight.slug}`}>
							<Card className='cursor-pointer transition-all hover:shadow-lg border-l-4 border-l-transparent hover:border-l-primary h-full'>
								<CardHeader className='pb-3'>
									<div className='flex items-start gap-3'>
										<div className='flex-1 min-w-0'>
											<CardTitle className='text-lg hover:text-primary transition-colors leading-tight'>{insight.title}</CardTitle>
										</div>
									</div>
								</CardHeader>
								<CardContent className='pt-0'>
									<CardDescription
										className='text-sm leading-relaxed mb-3 overflow-hidden'
										style={{
											display: '-webkit-box',
											WebkitLineClamp: 3,
											WebkitBoxOrient: 'vertical',
											lineHeight: '1.4em',
											maxHeight: '4.2em',
										}}>
										{insight.description}
									</CardDescription>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}
