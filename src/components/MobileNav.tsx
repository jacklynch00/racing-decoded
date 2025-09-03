'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Menu } from 'lucide-react';
import { ModeToggle } from './mode-toggle';

const navItems = [
	{ href: '/', label: 'Drivers' },
	{ href: '/rankings', label: 'Rankings' },
	{ href: '/insights', label: 'Insights' },
	{ href: '/track-animation', label: 'Track Animation' },
];

export function MobileNav() {
	const [isOpen, setIsOpen] = useState(false);
	const pathname = usePathname();

	return (
		<header className='border-b'>
			<div className='container mx-auto px-4 py-4'>
				<div className='flex justify-between items-center'>
					{/* Logo/Title */}
					<div>
						<Link href='/' className='flex items-center gap-3'>
							<Image src='/racing-decoded.png' alt='Racing Decoded' className='h-8 w-8' width={32} height={32} />
							<div>
								<h1 className='text-xl sm:text-2xl font-bold'>Racing Decoded</h1>
							</div>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<nav className='hidden md:flex items-center gap-2 lg:gap-4'>
						{navItems.map((item) => (
							<Link key={item.href} href={item.href}>
								<Button variant={pathname === item.href ? 'default' : 'ghost'} size='sm' className='text-xs lg:text-sm px-2 lg:px-3'>
									{item.label}
								</Button>
							</Link>
						))}
						<ModeToggle />
					</nav>

					{/* Mobile Navigation */}
					<div className='md:hidden flex items-center gap-2'>
						<ModeToggle />
						<Popover open={isOpen} onOpenChange={setIsOpen}>
							<PopoverTrigger asChild>
								<Button variant='ghost' size='sm'>
									<Menu className='h-5 w-5' />
									<span className='sr-only'>Toggle menu</span>
								</Button>
							</PopoverTrigger>
							<PopoverContent align='end' className='w-48 p-2'>
								<div className='flex flex-col gap-1'>
									{navItems.map((item) => (
										<Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
											<Button variant={pathname === item.href ? 'default' : 'ghost'} size='sm' className='w-full justify-start text-sm'>
												{item.label}
											</Button>
										</Link>
									))}
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</div>
		</header>
	);
}
