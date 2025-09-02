// F1 Track Animation System
// Uses SVG path animation with real lap time data

export interface LapData {
	lap: number;
	position: number;
	timeString: string | null;
	timeSeconds: number | null;
}

export interface PitStopData {
	stop: number;
	lap: number;
	timeString: string;
	duration: string;
	durationMs: number | null;
}

export interface AnimationData {
	raceInfo: {
		raceId: number;
		raceName: string;
		year: number;
		circuitName: string;
		date: string;
	};
	driverInfo: {
		driverId: number;
		name: string;
		nationality: string;
	};
	raceResult: {
		gridPosition: number;
		finishPosition: number | null;
		points: number;
		totalLaps: number;
		status: string;
	};
	lapTimes: LapData[];
	pitStops: PitStopData[];
	animationData: {
		totalLaps: number;
		hasLapTimes: boolean;
		hasPitStops: boolean;
		averageLapTime: number | null;
	};
}

export class F1TrackAnimator {
	private svgElement: SVGSVGElement | null = null;
	private trackPath: SVGPathElement | null = null;
	private carMarker: SVGCircleElement | null = null;
	private containerElement: HTMLElement | null = null;
	private isAnimating: boolean = false;
	private currentLap: number = 0;
	private animationSpeed: number = 1;
	private data: AnimationData | null = null;
	private animationId: number | null = null;
	private onLapUpdate?: (lap: number, totalLaps: number, lapTime?: number) => void;
	private onPitStop?: (lap: number, duration: number) => void;
	private onComplete?: () => void;
	private initialized: boolean = false;

	constructor() {}

	async loadTrack(): Promise<string> {
		try {
			const response = await fetch('/tracks/monaco.svg');
			if (!response.ok) {
				throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
			}

			const svgContent = await response.text();
			return svgContent;
		} catch (error) {
			console.error('Error loading track:', error);
			throw error;
		}
	}

	initializeTrack(containerElement: HTMLElement): void {
		if (this.initialized) {
			return;
		}

		this.containerElement = containerElement;
		this.svgElement = containerElement.querySelector('svg');
		if (!this.svgElement) {
			throw new Error('SVG element not found in container');
		}

		this.trackPath = this.svgElement.querySelector('path');
		if (!this.trackPath) {
			throw new Error('Track path not found in SVG');
		}

		this.setupAnimationElements();
		this.initialized = true;
	}

	private setupAnimationElements(): void {
		if (!this.svgElement || !this.trackPath) {
			console.log('setupAnimationElements: Missing elements');
			return;
		}

		console.log('setupAnimationElements: Setting up track styling...');

		// Style the track path
		this.trackPath.setAttribute('stroke', '#000000');
		this.trackPath.setAttribute('stroke-width', '4');
		this.trackPath.setAttribute('fill', 'none');

		console.log('setupAnimationElements: Complete');
	}

	private createCarMarker(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.svgElement || !this.trackPath) {
				console.log('Cannot create car marker - missing SVG or track path');
				reject(new Error('Missing SVG or track path'));
				return;
			}

			// Wait a bit for React to finish rendering, then find the embedded car marker
			setTimeout(() => {
				this.carMarker = this.svgElement!.querySelector('#car-marker');
				if (!this.carMarker) {
					console.error('Car marker still not found after timeout');
					reject(new Error('Car marker not found'));
					return;
				}

				console.log('createCarMarker: Found embedded car marker after timeout');
				console.log('createCarMarker: Car marker in DOM?', document.contains(this.carMarker));

				// Position at starting point using transform
				const startPoint = this.trackPath!.getPointAtLength(0);
				this.carMarker.setAttribute('transform', `translate(${startPoint.x}, ${startPoint.y})`);
				this.carMarker.setAttribute('opacity', '1');

				console.log('createCarMarker: Car marker positioned and ready');
				resolve();
			}, 100);
		});
	}

	loadAnimationData(data: AnimationData): void {
		this.data = data;
		this.currentLap = 0;
	}

	setCallbacks(callbacks: {
		onLapUpdate?: (lap: number, totalLaps: number, lapTime?: number) => void;
		onPitStop?: (lap: number, duration: number) => void;
		onComplete?: () => void;
	}): void {
		this.onLapUpdate = callbacks.onLapUpdate;
		this.onPitStop = callbacks.onPitStop;
		this.onComplete = callbacks.onComplete;
	}

	setSpeed(speed: number): void {
		this.animationSpeed = Math.max(0.25, Math.min(8, speed));
	}

	async start(): Promise<void> {
		console.log('Start called - checking elements:', {
			hasData: !!this.data,
			hasTrackPath: !!this.trackPath,
			hasCarMarker: !!this.carMarker,
			carMarkerInDom: this.carMarker ? document.contains(this.carMarker) : false,
		});

		if (!this.data || !this.trackPath) {
			console.error('Animation data or track path not loaded');
			return;
		}

		// Always create a fresh car marker for animation and wait for it to be ready
		console.log('Creating car marker for animation...');
		try {
			await this.createCarMarker();
		} catch (error) {
			console.error('Failed to create car marker:', error);
			return;
		}

		console.log('Starting animation...');
		this.isAnimating = true;
		this.currentLap = 0;

		if (this.carMarker) {
			this.carMarker.setAttribute('opacity', '1');
			console.log('Car marker visible and ready for animation');
			console.log('Final check - car marker in DOM?', document.contains(this.carMarker));
		} else {
			console.error('Car marker is null - cannot start animation');
			return;
		}

		this.animateNextLap();
	}

	pause(): void {
		this.isAnimating = false;
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	resume(): void {
		if (this.data && !this.isAnimating) {
			this.isAnimating = true;
			this.animateNextLap();
		}
	}

	reset(): void {
		this.pause();
		this.currentLap = 0;
		if (this.carMarker && this.trackPath) {
			this.carMarker.setAttribute('opacity', '0.7');
			// Reset car position to start using transform
			const startPoint = this.trackPath.getPointAtLength(0);
			this.carMarker.setAttribute('transform', `translate(${startPoint.x}, ${startPoint.y})`);
		}
	}

	private cleanup(): void {
		// Just clear the reference since the SVG car marker is part of the SVG content
		this.carMarker = null;
	}

	private animateNextLap(): void {
		console.log('animateNextLap called, currentLap:', this.currentLap);

		if (!this.data || !this.isAnimating || !this.trackPath || !this.carMarker) {
			console.log('Missing requirements for animation:', {
				hasData: !!this.data,
				isAnimating: this.isAnimating,
				hasTrackPath: !!this.trackPath,
				hasCarMarker: !!this.carMarker,
			});
			return;
		}

		if (this.currentLap >= this.data.lapTimes.length) {
			console.log('Animation complete - all laps finished');
			this.complete();
			return;
		}

		const lapData = this.data.lapTimes[this.currentLap];

		// Convert lap time to reasonable seconds (lap times are likely in milliseconds)
		let lapTimeSeconds = lapData.timeSeconds || this.data.animationData.averageLapTime || 90;

		// If lap time seems too large (> 5 minutes), it's probably in milliseconds
		if (lapTimeSeconds > 300) {
			lapTimeSeconds = lapTimeSeconds / 1000;
		}

		// Cap lap time to reasonable F1 range (60-120 seconds)
		lapTimeSeconds = Math.max(60, Math.min(120, lapTimeSeconds));

		console.log('Animating lap:', this.currentLap + 1, 'Duration:', lapTimeSeconds, 'seconds');

		// Check for pit stop on this lap
		const pitStop = this.data.pitStops.find((ps) => ps.lap === this.currentLap + 1);

		// Calculate animation duration (scaled by speed)
		const animationDuration = (lapTimeSeconds * 1000) / this.animationSpeed;
		console.log('Animation duration (ms):', animationDuration);

		// Notify lap update
		if (this.onLapUpdate) {
			this.onLapUpdate(this.currentLap + 1, this.data.animationData.totalLaps, lapTimeSeconds);
		}

		// Animate car around track
		this.animateCarAroundTrack(animationDuration, () => {
			// Handle pit stop if exists
			if (pitStop && this.onPitStop) {
				const pitDuration = pitStop.durationMs ? pitStop.durationMs / 1000 : 25; // Default 25 seconds
				this.onPitStop(pitStop.lap, pitDuration);

				// Delay next lap for pit stop
				setTimeout(() => {
					this.currentLap++;
					if (this.isAnimating) {
						this.animateNextLap();
					}
				}, (pitDuration * 1000) / this.animationSpeed);
			} else {
				this.currentLap++;
				if (this.isAnimating) {
					this.animateNextLap();
				}
			}
		});
	}

	private animateCarAroundTrack(duration: number, onComplete: () => void): void {
		if (!this.trackPath || !this.carMarker || !this.svgElement) {
			console.log('animateCarAroundTrack: Missing required elements');
			return;
		}

		const pathLength = this.trackPath.getTotalLength();
		const startTime = performance.now();
		console.log('Starting car animation - Duration:', duration, 'ms, Path length:', pathLength);

		const animate = (currentTime: number) => {
			if (!this.isAnimating || !this.trackPath || !this.carMarker) {
				console.log('Animation stopped or missing elements');
				return;
			}

			const elapsed = currentTime - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Get point along path - coordinates are in SVG space (0-1014, 0-1297)
			const distance = progress * pathLength;
			const point = this.trackPath.getPointAtLength(distance);

			// Update the car marker position using transform (more reliable for animation)
			this.carMarker.setAttribute('transform', `translate(${point.x}, ${point.y})`);

			// Log every 10% to avoid spam
			if (Math.floor(progress * 10) !== Math.floor(((elapsed - 16) / duration) * 10)) {
				console.log('Car marker updated:', {
					progress: Math.round(progress * 100) + '%',
					svgPosition: { x: point.x, y: point.y },
					transform: this.carMarker.getAttribute('transform'),
					isInDOM: document.contains(this.carMarker),
				});
			}

			if (progress < 1) {
				this.animationId = requestAnimationFrame(animate);
			} else {
				console.log('Lap animation complete');
				onComplete();
			}
		};

		this.animationId = requestAnimationFrame(animate);
		console.log('Animation frame requested, ID:', this.animationId);
	}

	private complete(): void {
		this.isAnimating = false;
		if (this.carMarker) {
			this.carMarker.setAttribute('opacity', '0.3');
		}
		if (this.onComplete) {
			this.onComplete();
		}
	}

	isRunning(): boolean {
		return this.isAnimating;
	}

	getCurrentLap(): number {
		return this.currentLap + 1;
	}

	getSpeed(): number {
		return this.animationSpeed;
	}

	destroy(): void {
		this.pause();
		this.cleanup();
		this.svgElement = null;
		this.trackPath = null;
		this.containerElement = null;
		this.data = null;
		this.onLapUpdate = undefined;
		this.onPitStop = undefined;
		this.onComplete = undefined;
	}
}

// Global animator instance
export const trackAnimator = new F1TrackAnimator();
