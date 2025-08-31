'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Play, Pause, RotateCcw, Settings } from 'lucide-react';

// Available tracks (starting with Monaco)
const AVAILABLE_TRACKS = [
  {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    lapDistance: 3.337,
    available: true
  },
  {
    id: 'silverstone', 
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    lapDistance: 5.891,
    available: false // Coming soon
  },
  {
    id: 'spa',
    name: 'Circuit de Spa-Francorchamps', 
    country: 'Belgium',
    lapDistance: 7.004,
    available: false // Coming soon
  }
];

interface Race {
  raceId: number;
  name: string;
  year: number;
  date: string;
  circuitId: number;
}

interface Driver {
  driverId: number;
  name: string;
  nationality: string;
}

export default function TrackAnimationPage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [availableRaces, setAvailableRaces] = useState<Race[]>([]);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);

  // Load races when track is selected
  useEffect(() => {
    if (selectedTrack) {
      loadRacesForTrack(selectedTrack);
    }
  }, [selectedTrack]);

  // Load drivers when race is selected  
  useEffect(() => {
    if (selectedRace) {
      loadDriversForRace(selectedRace.raceId);
    }
  }, [selectedRace]);

  const loadRacesForTrack = async (trackId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/track-animation/races?trackId=${trackId}`);
      const races = await response.json();
      setAvailableRaces(races);
    } catch (error) {
      console.error('Failed to load races:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDriversForRace = async (raceId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/track-animation/drivers?raceId=${raceId}`);
      const drivers = await response.json();
      setAvailableDrivers(drivers);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetSelections = () => {
    setSelectedTrack(null);
    setSelectedRace(null);
    setSelectedDriver(null);
    setAvailableRaces([]);
    setAvailableDrivers([]);
  };

  const canStartAnimation = selectedTrack && selectedRace && selectedDriver;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to drivers
            </Button>
          </Link>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold">F1 Track Animation</h1>
          <p className="text-muted-foreground">Experience races come alive with real lap time data</p>
        </div>
      </div>

      {/* Selection Flow */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Step 1: Track Selection */}
        <Card className={selectedTrack ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
              Select Track
            </CardTitle>
            <CardDescription>Choose a circuit to visualize</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {AVAILABLE_TRACKS.map((track) => (
              <div
                key={track.id}
                className={`p-3 border rounded cursor-pointer transition-all ${
                  selectedTrack === track.id 
                    ? 'border-primary bg-primary/5' 
                    : track.available 
                      ? 'hover:border-primary/50' 
                      : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => track.available && setSelectedTrack(track.id)}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium">{track.name}</h3>
                  {!track.available && (
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{track.country}</p>
                <p className="text-xs text-muted-foreground">{track.lapDistance}km lap</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Step 2: Race Selection */}
        <Card className={selectedRace ? 'border-primary' : selectedTrack ? '' : 'opacity-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                selectedTrack ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>2</span>
              Select Race
            </CardTitle>
            <CardDescription>
              {selectedTrack ? 'Choose a specific race weekend' : 'Select a track first'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading races...</p>
            ) : availableRaces.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableRaces.map((race) => (
                  <div
                    key={race.raceId}
                    className={`p-3 border rounded cursor-pointer transition-all ${
                      selectedRace?.raceId === race.raceId 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRace(race)}
                  >
                    <h3 className="font-medium">{race.name}</h3>
                    <p className="text-sm text-muted-foreground">{race.year}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(race.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : selectedTrack ? (
              <p className="text-center text-muted-foreground py-4">No races available</p>
            ) : (
              <p className="text-center text-muted-foreground py-4">Select a track to see available races</p>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Driver Selection */}
        <Card className={selectedDriver ? 'border-primary' : selectedRace ? '' : 'opacity-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                selectedRace ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>3</span>
              Select Driver
            </CardTitle>
            <CardDescription>
              {selectedRace ? 'Choose a driver to animate' : 'Select a race first'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading drivers...</p>
            ) : availableDrivers.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {availableDrivers.map((driver) => (
                  <div
                    key={driver.driverId}
                    className={`p-3 border rounded cursor-pointer transition-all ${
                      selectedDriver?.driverId === driver.driverId 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedDriver(driver)}
                  >
                    <h3 className="font-medium">{driver.name}</h3>
                    <p className="text-sm text-muted-foreground">{driver.nationality}</p>
                  </div>
                ))}
              </div>
            ) : selectedRace ? (
              <p className="text-center text-muted-foreground py-4">No drivers available</p>
            ) : (
              <p className="text-center text-muted-foreground py-4">Select a race to see available drivers</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Animation Controls */}
      {canStartAnimation && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Animate!</CardTitle>
            <CardDescription>
              Watch {selectedDriver?.name} race around {AVAILABLE_TRACKS.find(t => t.id === selectedTrack)?.name} 
              {' '}in {selectedRace?.name} {selectedRace?.year}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button size="lg">
                  <Play className="mr-2 h-4 w-4" />
                  Start Animation
                </Button>
                <Button variant="outline" size="lg" disabled>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
                <Button variant="outline" size="lg" onClick={resetSelections}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Settings className="h-4 w-4" />
                <span>Animation controls coming soon</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Preview */}
      {!canStartAnimation && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>🏁 F1 Track Animation Preview</CardTitle>
            <CardDescription>
              Experience Formula 1 races like never before with real lap time data visualization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-medium mb-2">✨ Features</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Real lap time data from your F1 database</li>
                  <li>• Interactive track visualization</li>
                  <li>• Pit stop animations and timing</li>
                  <li>• Adjustable animation speed controls</li>
                  <li>• See how DNA traits affect track performance</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">🏎️ Available Tracks</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Monaco (Available now)</li>
                  <li>• Silverstone (Coming soon)</li>
                  <li>• Spa-Francorchamps (Coming soon)</li>
                  <li>• More tracks being added</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}