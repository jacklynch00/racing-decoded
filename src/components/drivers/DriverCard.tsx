import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCountryFlag } from '@/lib/flags';
import { DriverAvatar } from '@/components/driver-avatar';
import { DriverWithDNA } from '@/lib/types';
import { DNAScoreBadge } from './DNAScoreBadge';

interface DriverCardProps {
	driver: DriverWithDNA;
}

export function DriverCard({ driver }: DriverCardProps) {
	const profile = driver.dnaProfile;
	const flag = getCountryFlag(driver.nationality);

	if (!profile) {
		return null; // Skip drivers without DNA profiles
	}

	return (
		<Link href={`/driver/${driver.id}`}>
			<Card className='cursor-pointer'>
				<CardHeader>
					<div className='flex items-start gap-3 mb-2'>
						<DriverAvatar driverId={driver.id} driverName={driver.name} imageUrl={profile.imageUrl} size={48} />
						<div className='flex-1'>
							<CardTitle className='flex justify-between items-start mb-1'>
								{driver.name}
								{flag && (
									<span className='text-xl cursor-help' title={driver.nationality || undefined}>
										{flag}
									</span>
								)}
							</CardTitle>
							<CardDescription>
								{profile.racesAnalyzed} races analyzed • {profile.careerSpan}
								{profile.wins && profile.wins > 0 && (
									<>
										{' '}
										• {profile.wins} win{profile.wins !== 1 ? 's' : ''}
									</>
								)}
								{driver.age && <> • {driver.age} years old</>}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className='flex flex-wrap gap-2'>
						<DNAScoreBadge label='Aggression' score={profile.aggressionScore} />
						<DNAScoreBadge label='Consistency' score={profile.consistencyScore} />
						<DNAScoreBadge label='Racecraft' score={profile.racecraftScore} />
						<DNAScoreBadge label='Pressure' score={profile.pressurePerformanceScore} />
						{profile.clutchFactorScore && <DNAScoreBadge label='Clutch' score={profile.clutchFactorScore} />}
						<DNAScoreBadge label='Race Start' score={profile.raceStartScore} />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}