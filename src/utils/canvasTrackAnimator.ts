// Canvas-based F1 Track Animation System
// Provides smooth 60fps car animation using HTML5 Canvas

import { AnimationData } from './trackAnimation';
import { TrackLayout } from './trackLayouts';

export interface CanvasCarPosition {
	x: number;
	y: number;
}

export class CanvasF1Animator {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private track: TrackLayout;

	// Animation state
	private isAnimating: boolean = false;
	private currentLap: number = 0;
	private animationSpeed: number = 1;
	private data: AnimationData | null = null;
	private animationId: number | null = null;

	// Timing
	private startTime: number = 0;
	private lapStartTime: number = 0;

	// Car properties
	private carPosition: CanvasCarPosition = { x: 0, y: 0 };
	private carSize: number = 12;

	// Canvas scaling
	private scale: number = 1;
	private offsetX: number = 0;
	private offsetY: number = 0;

	// Callbacks
	private onLapUpdate?: (lap: number, totalLaps: number, lapTime?: number, lapProgress?: number) => void;
	private onPitStop?: (lap: number, duration: number) => void;
	private onComplete?: () => void;

	constructor(canvas: HTMLCanvasElement, track: TrackLayout) {
		this.canvas = canvas;
		this.track = track;

		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Failed to get 2D canvas context');
		}
		this.ctx = context;

		this.setupCanvas();
		this.calculateTrackScale();
		this.reset();
	}

	private setupCanvas(): void {
		// Handle high DPI displays
		const dpr = window.devicePixelRatio || 1;

		// Store the original intended dimensions
		const originalWidth = this.canvas.width;
		const originalHeight = this.canvas.height;

		// Scale canvas buffer for high DPI
		this.canvas.width = originalWidth * dpr;
		this.canvas.height = originalHeight * dpr;
		
		// Scale the context back down so that drawing commands work at original scale
		this.ctx.scale(dpr, dpr);
		
		// Set display size to original dimensions
		this.canvas.style.width = originalWidth + 'px';
		this.canvas.style.height = originalHeight + 'px';
	}

	private calculateTrackScale(): void {
		const padding = 40;
		// Use original dimensions (before DPI scaling)
		const canvasWidth = parseInt(this.canvas.style.width) || this.canvas.width / (window.devicePixelRatio || 1);
		const canvasHeight = parseInt(this.canvas.style.height) || this.canvas.height / (window.devicePixelRatio || 1);

		// Find track bounds
		const xs = this.track.coordinates.map((coord) => coord[0]);
		const ys = this.track.coordinates.map((coord) => coord[1]);

		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);

		const trackWidth = maxX - minX;
		const trackHeight = maxY - minY;

		// Calculate scale to fit track in canvas with padding
		this.scale = Math.min((canvasWidth - padding * 2) / trackWidth, (canvasHeight - padding * 2) / trackHeight);

		// Center the track
		this.offsetX = (canvasWidth - trackWidth * this.scale) / 2 - minX * this.scale;
		this.offsetY = (canvasHeight - trackHeight * this.scale) / 2 - minY * this.scale;
	}

	private screenCoordinate(trackX: number, trackY: number): CanvasCarPosition {
		return {
			x: trackX * this.scale + this.offsetX,
			y: trackY * this.scale + this.offsetY,
		};
	}

	loadAnimationData(data: AnimationData): void {
		this.data = data;
		this.reset();
	}

	loadAnimationDataWithoutReset(data: AnimationData): void {
		this.data = data;
		// Reset animation state but keep track visible
		this.pause();
		this.currentLap = 0;
		
		// Reset car to starting position
		if (this.track.coordinates.length > 0) {
			const startPos = this.screenCoordinate(this.track.coordinates[0][0], this.track.coordinates[0][1]);
			this.carPosition = startPos;
			
			// Just redraw without clearing (track stays visible)
			this.draw();
		}
	}

	setCallbacks(callbacks: {
		onLapUpdate?: (lap: number, totalLaps: number, lapTime?: number, lapProgress?: number) => void;
		onPitStop?: (lap: number, duration: number) => void;
		onComplete?: () => void;
	}): void {
		this.onLapUpdate = callbacks.onLapUpdate;
		this.onPitStop = callbacks.onPitStop;
		this.onComplete = callbacks.onComplete;
	}

	setSpeed(speed: number): void {
		const wasAnimating = this.isAnimating;
		const oldSpeed = this.animationSpeed;
		this.animationSpeed = Math.max(1, Math.min(6, speed));

		if (wasAnimating && oldSpeed !== this.animationSpeed) {
			// Calculate how much time has elapsed in the current lap at the old speed
			const currentProgress = this.getCurrentLapProgress();
			const currentLapTime = this.getCurrentLapTime();

			if (currentLapTime && currentProgress < 1) {
				// Adjust the lap start time to maintain the same progress but at new speed
				const newElapsedTime = (currentProgress * currentLapTime * 1000) / this.animationSpeed;
				this.lapStartTime = performance.now() - newElapsedTime;
			}
		}
	}

	start(): void {
		if (!this.data || this.data.lapTimes.length === 0) {
			console.error('No race data loaded');
			return;
		}

		this.isAnimating = true;
		this.currentLap = 0;
		this.startTime = performance.now();
		this.lapStartTime = this.startTime;

		this.animate();
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
			this.lapStartTime = performance.now() - (this.getCurrentLapProgress() * this.getCurrentLapTime() * 1000) / this.animationSpeed;
			this.animate();
		}
	}

	reset(): void {
		this.pause();
		this.currentLap = 0;

		// Reset car to starting position
		if (this.track.coordinates.length > 0) {
			const startPos = this.screenCoordinate(this.track.coordinates[0][0], this.track.coordinates[0][1]);
			this.carPosition = startPos;
		}

		// Force a complete redraw
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.draw();
	}

	private animate(): void {
		if (!this.isAnimating || !this.data) return;

		const now = performance.now();

		// Safety check - shouldn't happen with new logic
		if (this.currentLap >= this.data.lapTimes.length) {
			this.complete();
			return;
		}

		const lapData = this.data.lapTimes[this.currentLap];
		const elapsed = (now - this.lapStartTime) / 1000;

		// Get lap time in seconds
		let lapTimeSeconds = lapData.timeSeconds || this.data.animationData.averageLapTime || 90;

		// Convert from milliseconds if needed
		if (lapTimeSeconds > 300) {
			lapTimeSeconds = lapTimeSeconds / 1000;
		}

		// Clamp to reasonable F1 range
		lapTimeSeconds = Math.max(60, Math.min(120, lapTimeSeconds));

		// Calculate animation duration (scaled by speed)
		const animationDuration = lapTimeSeconds / this.animationSpeed;
		const lapProgress = Math.min(elapsed / animationDuration, 1);

		// Update car position
		this.updateCarPosition(lapProgress);

		// Draw everything
		this.draw();

		// Update progress callback every frame for smooth progress bar
		if (this.onLapUpdate) {
			this.onLapUpdate(this.currentLap + 1, this.data.animationData.totalLaps, lapTimeSeconds, lapProgress);
		}

		// Check for lap completion
		if (lapProgress >= 1) {
			// Move to next lap
			this.currentLap++;
			this.lapStartTime = performance.now();

			// Check if we've completed all laps after incrementing
			if (this.currentLap >= this.data.lapTimes.length) {
				this.complete();
				return;
			}
		}

		// Continue animation
		if (this.isAnimating) {
			this.animationId = requestAnimationFrame(() => this.animate());
		}
	}

	private updateCarPosition(progress: number): void {
		// Progress is 0-1 for complete lap
		const totalPoints = this.track.coordinates.length;
		const exactIndex = progress * (totalPoints - 1);
		const lowerIndex = Math.floor(exactIndex);
		const upperIndex = Math.min(Math.ceil(exactIndex), totalPoints - 1);
		const t = exactIndex - lowerIndex;

		// Interpolate between track points
		const [x1, y1] = this.track.coordinates[lowerIndex];
		const [x2, y2] = this.track.coordinates[upperIndex];

		const trackX = x1 + (x2 - x1) * t;
		const trackY = y1 + (y2 - y1) * t;

		this.carPosition = this.screenCoordinate(trackX, trackY);
	}

	private draw(): void {
		// Clear canvas
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Set anti-aliasing
		this.ctx.imageSmoothingEnabled = true;

		// Draw track
		this.drawTrack();

		// Draw start/finish line
		this.drawStartFinishLine();

		// Draw car
		this.drawCar();
	}

	private drawTrack(): void {
		this.ctx.strokeStyle = '#ffffff';
		this.ctx.lineWidth = 8;
		this.ctx.lineCap = 'round';
		this.ctx.lineJoin = 'round';

		this.ctx.beginPath();

		this.track.coordinates.forEach((coord, index) => {
			const screenPos = this.screenCoordinate(coord[0], coord[1]);
			if (index === 0) {
				this.ctx.moveTo(screenPos.x, screenPos.y);
			} else {
				this.ctx.lineTo(screenPos.x, screenPos.y);
			}
		});

		this.ctx.closePath();
		this.ctx.stroke();

		// Add track outline for better visibility
		this.ctx.strokeStyle = '#000000';
		this.ctx.lineWidth = 10;
		this.ctx.globalCompositeOperation = 'destination-over';
		this.ctx.stroke();
		this.ctx.globalCompositeOperation = 'source-over';
	}

	private drawCar(): void {
		// Draw car shadow
		this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
		this.ctx.beginPath();
		this.ctx.arc(this.carPosition.x + 2, this.carPosition.y + 2, this.carSize, 0, 2 * Math.PI);
		this.ctx.fill();

		// Draw car body
		this.ctx.fillStyle = '#ef4444';
		this.ctx.strokeStyle = '#ffffff';
		this.ctx.lineWidth = 2;

		this.ctx.beginPath();
		this.ctx.arc(this.carPosition.x, this.carPosition.y, this.carSize, 0, 2 * Math.PI);
		this.ctx.fill();
		this.ctx.stroke();

		// Draw car highlight
		this.ctx.fillStyle = '#ff6b6b';
		this.ctx.beginPath();
		this.ctx.arc(this.carPosition.x - 2, this.carPosition.y - 2, this.carSize * 0.4, 0, 2 * Math.PI);
		this.ctx.fill();
	}

	private drawStartFinishLine(): void {
		if (this.track.coordinates.length === 0) return;

		const startPos = this.screenCoordinate(this.track.coordinates[0][0], this.track.coordinates[0][1]);

		this.ctx.strokeStyle = '#22c55e';
		this.ctx.lineWidth = 3;
		this.ctx.setLineDash([8, 4]);

		this.ctx.beginPath();
		this.ctx.moveTo(startPos.x - 15, startPos.y);
		this.ctx.lineTo(startPos.x + 15, startPos.y);
		this.ctx.stroke();

		this.ctx.setLineDash([]); // Reset dash
	}

	private getCurrentLapTime(): number {
		if (!this.data || this.currentLap >= this.data.lapTimes.length) return 90;

		const lapData = this.data.lapTimes[this.currentLap];
		let lapTimeSeconds = lapData.timeSeconds || this.data.animationData.averageLapTime || 90;

		if (lapTimeSeconds > 300) {
			lapTimeSeconds = lapTimeSeconds / 1000;
		}

		return Math.max(60, Math.min(120, lapTimeSeconds));
	}

	private getCurrentLapProgress(): number {
		if (!this.data) return 0;

		const now = performance.now();
		const elapsed = (now - this.lapStartTime) / 1000;
		const lapTime = this.getCurrentLapTime() / this.animationSpeed;

		return Math.min(elapsed / lapTime, 1);
	}

	private complete(): void {
		this.isAnimating = false;
		if (this.onComplete) {
			this.onComplete();
		}
	}

	// Public getters for compatibility
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
		// Clear callbacks
		this.onLapUpdate = undefined;
		this.onPitStop = undefined;
		this.onComplete = undefined;
	}
}

// Global Canvas animator instance
export let canvasTrackAnimator: CanvasF1Animator | null = null;

export function initializeCanvasAnimator(canvas: HTMLCanvasElement, track: TrackLayout): CanvasF1Animator {
	canvasTrackAnimator = new CanvasF1Animator(canvas, track);
	return canvasTrackAnimator;
}
