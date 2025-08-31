'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getDriverInitials } from '@/lib/driver-images';

interface DriverAvatarProps {
	driverId: number;
	driverName: string;
	imageUrl?: string | null;
	size?: number;
	className?: string;
}

export function DriverAvatar({ driverName, imageUrl, size = 64, className = '' }: DriverAvatarProps) {
	const [imageError, setImageError] = useState(false);
	const [isLoading, setIsLoading] = useState(!!imageUrl);

	const initials = getDriverInitials(driverName);

	const handleImageError = () => {
		setImageError(true);
		setIsLoading(false);
	};

	const handleImageLoad = () => {
		setIsLoading(false);
		setImageError(false);
	};

	// Show initials if no imageUrl provided or if image failed to load
	if (!imageUrl || imageError) {
		return (
			<div
				className={`flex items-center justify-center bg-muted text-muted-foreground font-medium rounded-full ${className}`}
				style={{ width: size, height: size, fontSize: size * 0.35 }}>
				{initials}
			</div>
		);
	}

	return (
		<div className={`relative rounded-full overflow-hidden ${className}`} style={{ width: size, height: size }}>
			{isLoading && (
				<div className='absolute inset-0 flex items-center justify-center bg-muted'>
					<div className='animate-pulse text-muted-foreground text-xs'>...</div>
				</div>
			)}
			<Image
				src={imageUrl}
				alt={driverName}
				width={size}
				height={size}
				className='object-cover w-full h-full'
				onError={handleImageError}
				onLoad={handleImageLoad}
				unoptimized // Allow external URLs
			/>
		</div>
	);
}
