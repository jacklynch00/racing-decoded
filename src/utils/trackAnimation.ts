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

  async loadTrack(containerElement: HTMLElement): Promise<string> {
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
      return;
    }

    // Create car marker
    this.carMarker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.carMarker.setAttribute('id', 'car-marker');
    this.carMarker.setAttribute('r', '8');
    this.carMarker.setAttribute('fill', '#ff6b35');
    this.carMarker.setAttribute('stroke', '#fff');
    this.carMarker.setAttribute('stroke-width', '2');
    this.carMarker.style.opacity = '0.7';
    this.carMarker.setAttribute('filter', 'drop-shadow(0 0 6px #ff6b35)');

    this.svgElement.appendChild(this.carMarker);

    // Position car at starting point and create start/finish line
    const startPoint = this.trackPath.getPointAtLength(0);
    this.carMarker.setAttribute('cx', startPoint.x.toString());
    this.carMarker.setAttribute('cy', startPoint.y.toString());
    
    const startFinishLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    startFinishLine.setAttribute('id', 'start-finish-line');
    startFinishLine.setAttribute('x1', (startPoint.x - 15).toString());
    startFinishLine.setAttribute('y1', (startPoint.y - 15).toString());
    startFinishLine.setAttribute('x2', (startPoint.x + 15).toString());
    startFinishLine.setAttribute('y2', (startPoint.y + 15).toString());
    startFinishLine.setAttribute('stroke', '#22c55e');
    startFinishLine.setAttribute('stroke-width', '6');
    startFinishLine.setAttribute('opacity', '0.9');

    this.svgElement.appendChild(startFinishLine);

    // Style the track path
    this.trackPath.setAttribute('stroke', '#000000');
    this.trackPath.setAttribute('stroke-width', '4');
    this.trackPath.setAttribute('fill', 'none');
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

  start(): void {
    if (!this.data || !this.trackPath || !this.carMarker) {
      console.error('Animation data or track elements not loaded');
      return;
    }

    this.isAnimating = true;
    this.currentLap = 0;
    this.carMarker.style.opacity = '1';
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
    if (this.carMarker) {
      this.carMarker.style.opacity = '0.7';
      // Reset car position to start
      if (this.trackPath) {
        const startPoint = this.trackPath.getPointAtLength(0);
        this.carMarker.setAttribute('cx', startPoint.x.toString());
        this.carMarker.setAttribute('cy', startPoint.y.toString());
      }
    }
  }

  private cleanup(): void {
    // Clear references only, let React handle DOM cleanup
    this.carMarker = null;
  }

  private animateNextLap(): void {
    if (!this.data || !this.isAnimating || !this.trackPath || !this.carMarker) {
      return;
    }

    if (this.currentLap >= this.data.lapTimes.length) {
      this.complete();
      return;
    }

    const lapData = this.data.lapTimes[this.currentLap];
    const lapTimeSeconds = lapData.timeSeconds || this.data.animationData.averageLapTime || 90; // Default 90 seconds
    
    // Check for pit stop on this lap
    const pitStop = this.data.pitStops.find(ps => ps.lap === this.currentLap + 1);
    
    // Calculate animation duration (scaled by speed)
    const animationDuration = (lapTimeSeconds * 1000) / this.animationSpeed; // Convert to milliseconds
    
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
    if (!this.trackPath || !this.carMarker) return;

    const pathLength = this.trackPath.getTotalLength();
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isAnimating || !this.trackPath || !this.carMarker) {
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Get point along path
      const distance = progress * pathLength;
      const point = this.trackPath.getPointAtLength(distance);

      // Update car position
      this.carMarker.setAttribute('cx', point.x.toString());
      this.carMarker.setAttribute('cy', point.y.toString());

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private complete(): void {
    this.isAnimating = false;
    if (this.carMarker) {
      this.carMarker.style.opacity = '0';
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
    this.data = null;
    this.onLapUpdate = undefined;
    this.onPitStop = undefined;
    this.onComplete = undefined;
  }
}

// Global animator instance
export const trackAnimator = new F1TrackAnimator();