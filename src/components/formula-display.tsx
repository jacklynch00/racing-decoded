'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FormulaStep, TraitFormula } from '@/lib/dna-formulas';

interface FormulaDisplayProps {
	traitFormula: TraitFormula;
	contributingStats: Record<string, unknown>;
	finalScore: number;
}

interface StepDisplayProps {
	step: FormulaStep;
	contributingStats: Record<string, unknown>;
	stepIndex: number;
}

function StepDisplay({ step, contributingStats, stepIndex }: StepDisplayProps) {
	// Try to extract actual values from contributing stats to substitute in formula
	const getValueForVariable = (varName: string): number | null => {
		// Look for the variable in contributing stats with various naming patterns
		const possibleKeys = [
			varName,
			varName.replace(/_/g, ''),
			varName.replace(/([A-Z])/g, '_$1').toLowerCase(),
			// Add more naming pattern mappings as needed
		];

		for (const key of possibleKeys) {
			if (contributingStats[key] !== undefined) {
				return typeof contributingStats[key] === 'number' ? contributingStats[key] : null;
			}
		}
		return null;
	};

	// Substitute actual values into the formula where possible
	const substituteFormula = (formula: string): string => {
		let result = formula;
		Object.entries(step.variables).forEach(([varName]) => {
			const value = getValueForVariable(varName);
			if (value !== null) {
				// Replace variable with actual value, keeping original for reference
				const regex = new RegExp(`\\b${varName}\\b`, 'g');
				result = result.replace(regex, `${varName}(${value.toFixed(2)})`);
			}
		});
		return result;
	};

	return (
		<div className='border rounded-lg p-4 bg-muted/30'>
			<div className='flex items-center gap-2 mb-2'>
				<Badge variant='outline' className='text-xs'>
					Step {stepIndex + 1}
				</Badge>
				<span className='text-sm font-medium'>{step.description}</span>
			</div>

			<div className='space-y-2'>
				<div className='bg-background rounded p-2 font-mono text-sm'>
					<div className='text-muted-foreground mb-1'>Formula:</div>
					<div className='break-all'>{substituteFormula(step.formula)}</div>
				</div>

				{Object.keys(step.variables).length > 0 && (
					<div className='text-xs'>
						<div className='text-muted-foreground mb-1'>Variables:</div>
						<div className='grid gap-1'>
							{Object.entries(step.variables).map(([varName, description]) => {
								const actualValue = getValueForVariable(varName);
								return (
									<div key={varName} className='flex justify-between'>
										<span className='font-mono'>{varName}:</span>
										<span className='text-muted-foreground'>
											{description}
											{actualValue !== null && <span className='ml-2 font-mono text-primary'>= {actualValue.toFixed(2)}</span>}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{step.result && (
					<div className='bg-primary/10 rounded p-2'>
						<div className='text-sm font-medium'>Result: {step.result}</div>
					</div>
				)}
			</div>
		</div>
	);
}

interface ComponentDisplayProps {
	component: TraitFormula['components'][0];
	contributingStats: Record<string, unknown>;
	componentIndex: number;
}

function ComponentDisplay({ component, contributingStats }: ComponentDisplayProps) {
	return (
		<Card className='p-4'>
			<div className='flex items-center justify-between mb-4'>
				<h4 className='font-semibold'>{component.name}</h4>
				<Badge variant='secondary'>Weight: {(component.weight * 100).toFixed(0)}%</Badge>
			</div>

			<div className='space-y-3'>
				{component.steps.map((step, stepIndex) => (
					<StepDisplay key={stepIndex} step={step} contributingStats={contributingStats} stepIndex={stepIndex} />
				))}
			</div>
		</Card>
	);
}

export function FormulaDisplay({ traitFormula, contributingStats, finalScore }: FormulaDisplayProps) {
	return (
		<div className='space-y-6'>
			<div>
				<h3 className='text-lg font-semibold mb-2'>Mathematical Formula</h3>
				<p className='text-sm text-muted-foreground mb-4'>{traitFormula.description}</p>
			</div>

			<div className='space-y-4'>
				<h4 className='font-medium'>Components Breakdown:</h4>
				{traitFormula.components.map((component, index) => (
					<ComponentDisplay key={index} component={component} contributingStats={contributingStats} componentIndex={index} />
				))}
			</div>

			<Card className='p-4 bg-primary/5 border-primary/20'>
				<h4 className='font-semibold mb-2'>Final Calculation</h4>
				<div className='bg-background rounded p-3 font-mono text-sm mb-2'>{traitFormula.finalCalculation.formula}</div>
				<p className='text-sm text-muted-foreground mb-2'>{traitFormula.finalCalculation.description}</p>
				<div className='flex items-center justify-between'>
					<span className='font-medium'>Final Score:</span>
					<Badge variant='default' className='text-lg font-bold'>
						{finalScore.toFixed(1)}
					</Badge>
				</div>
			</Card>

			<div className='text-xs text-muted-foreground bg-muted/50 rounded p-3'>
				<strong>Note:</strong> Values in parentheses show actual data used in calculations. Complex conditional logic and intermediate calculations may not be fully visible
				but follow the mathematical principles outlined above.
			</div>
		</div>
	);
}
