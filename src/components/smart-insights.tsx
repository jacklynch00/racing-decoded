'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import type { DriverWithDNA } from '@/lib/types';

interface SmartInsightsProps {
	driver: DriverWithDNA;
}

interface Insight {
	type: 'explanation' | 'highlight' | 'caveat';
	title: string;
	description: string;
	icon: React.ReactNode;
}

function generateInsights(driver: DriverWithDNA): Insight[] {
	const profile = driver.dnaProfile;
	if (!profile) return [];

	const insights: Insight[] = [];
	const wins = profile.wins || 0;
	const avgFinish = profile.avgFinishPosition || 10;
	const racesAnalyzed = profile.racesAnalyzed;

	// Aggression vs Success Pattern
	if (profile.aggressionScore && profile.aggressionScore < 55 && wins > 15) {
		insights.push({
			type: 'explanation',
			title: 'Dominance Effect',
			description: `${driver.name.split(' ')[0]}'s low aggression score (${profile.aggressionScore.toFixed(
				1
			)}) reflects dominance rather than passivity. With ${wins} wins, they often start from pole with less need for aggressive overtaking moves.`,
			icon: <TrendingUp className='h-4 w-4 text-blue-500' />,
		});
	}

	// High aggression with moderate success
	if (profile.aggressionScore && profile.aggressionScore > 65 && wins < 10 && racesAnalyzed > 150) {
		insights.push({
			type: 'caveat',
			title: 'Opportunity-Based Aggression',
			description: `High aggression score (${profile.aggressionScore.toFixed(
				1
			)}) may reflect driving in less competitive cars, requiring more overtaking moves to score points.`,
			icon: <AlertTriangle className='h-4 w-4 text-yellow-500' />,
		});
	}

	// Consistency vs Aggression Balance
	if (profile.consistencyScore && profile.aggressionScore && profile.consistencyScore > profile.aggressionScore + 20) {
		insights.push({
			type: 'highlight',
			title: 'Calculated Racer',
			description: `Strong consistency (${profile.consistencyScore.toFixed(1)}) paired with measured aggression suggests a strategic, risk-managed driving approach.`,
			icon: <TrendingUp className='h-4 w-4 text-green-500' />,
		});
	}

	// Racecraft vs Aggression
	if (profile.racecraftScore && profile.aggressionScore && profile.racecraftScore > 75 && profile.aggressionScore < 50) {
		insights.push({
			type: 'explanation',
			title: 'Quality Over Quantity',
			description: `High racecraft (${profile.racecraftScore.toFixed(
				1
			)}) with moderate aggression indicates excellent wheel-to-wheel skill when opportunities arise, rather than constant attacking.`,
			icon: <Lightbulb className='h-4 w-4 text-blue-500' />,
		});
	}

	// Pressure Performance Context
	if (profile.pressurePerformanceScore && profile.pressurePerformanceScore > 60 && wins > 20) {
		insights.push({
			type: 'highlight',
			title: 'Championship Mentality',
			description: `Strong pressure performance (${profile.pressurePerformanceScore.toFixed(
				1
			)}) combined with ${wins} wins demonstrates ability to deliver when stakes are highest.`,
			icon: <TrendingUp className='h-4 w-4 text-green-500' />,
		});
	}

	// Era Adjustment Context
	if (
		(profile.careerSpan && profile.careerSpan.includes('195')) ||
		profile.careerSpan.includes('196') ||
		profile.careerSpan.includes('197') ||
		profile.careerSpan.includes('198')
	) {
		if (profile.aggressionScore && profile.aggressionScore > 70) {
			insights.push({
				type: 'explanation',
				title: 'Classic Era Advantage',
				description: `Racing in the ${profile.careerSpan} era provided more wheel-to-wheel opportunities, naturally inflating aggression scores compared to modern strategic racing.`,
				icon: <Lightbulb className='h-4 w-4 text-blue-500' />,
			});
		}
	}

	// Modern Era Low Aggression
	if (
		profile.careerSpan &&
		(profile.careerSpan.includes('201') || profile.careerSpan.includes('202')) &&
		profile.aggressionScore &&
		profile.aggressionScore < 50 &&
		avgFinish < 5
	) {
		insights.push({
			type: 'explanation',
			title: 'Modern Era Context',
			description: `Low aggression scores in modern F1 often indicate front-running drivers where track position and strategy matter more than constant overtaking.`,
			icon: <Lightbulb className='h-4 w-4 text-blue-500' />,
		});
	}

	return insights.slice(0, 2); // Limit to 2 most relevant insights
}

export function SmartInsights({ driver }: SmartInsightsProps) {
	const insights = generateInsights(driver);

	if (insights.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Lightbulb className='h-5 w-5 text-yellow-500' />
					Smart Insights
				</CardTitle>
			</CardHeader>
			<CardContent className='space-y-4'>
				{insights.map((insight, index) => (
					<div key={index} className='flex gap-3 p-3 rounded-lg bg-muted/30'>
						<div className='flex-shrink-0 mt-0.5'>{insight.icon}</div>
						<div className='space-y-1'>
							<div className='flex items-center gap-2'>
								<h4 className='font-medium text-sm'>{insight.title}</h4>
								<Badge variant={insight.type === 'highlight' ? 'default' : insight.type === 'caveat' ? 'secondary' : 'outline'} className='text-xs'>
									{insight.type}
								</Badge>
							</div>
							<p className='text-sm text-muted-foreground leading-relaxed'>{insight.description}</p>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
