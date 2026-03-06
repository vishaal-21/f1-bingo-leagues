import { useState, useEffect } from 'react';
import { Calendar, Clock, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  getCurrentTime,
  getOffsetString,
  addHours,
  addDays,
  resetTimeOffset,
  isDevTimeActive,
} from '../lib/devTime';

/**
 * Dev Time Control Panel
 * Allows developers to shift the application's perceived time for testing
 * Only visible in development mode
 */
export function DevTimeControl() {
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [offsetString, setOffsetString] = useState(getOffsetString());
  const [isMinimized, setIsMinimized] = useState(false);
  const [isActive, setIsActive] = useState(isDevTimeActive());

  // Update time display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Listen for time offset changes
  useEffect(() => {
    const handleTimeChange = () => {
      setCurrentTime(getCurrentTime());
      setOffsetString(getOffsetString());
      setIsActive(isDevTimeActive());
      
      // Force page reload to update all components
      window.location.reload();
    };

    window.addEventListener('devTimeChange', handleTimeChange);
    return () => window.removeEventListener('devTimeChange', handleTimeChange);
  }, []);

  // Only render in development mode
  if (import.meta.env.PROD) {
    return null;
  }

  const timeString = currentTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 shadow-lg border-2 transition-all ${
        isActive ? 'border-orange-500' : 'border-gray-300'
      }`}
      style={{ minWidth: '320px' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500 to-red-500 text-white cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-semibold text-sm">Dev Time Control</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
        >
          {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-4 space-y-3">
          {/* Current Time Display */}
          <div className="bg-gray-100 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Calendar className="w-4 h-4" />
              Current Time:
            </div>
            <div className="text-sm font-mono text-gray-900">{timeString}</div>
            <div
              className={`text-xs font-semibold ${
                isActive ? 'text-orange-600' : 'text-gray-500'
              }`}
            >
              {offsetString}
            </div>
          </div>

          {/* Quick Time Shift Buttons */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600 uppercase">Quick Shifts</div>
            
            {/* Forward Controls */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addHours(1)}
                className="text-xs"
              >
                +1 Hour
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addDays(1)}
                className="text-xs"
              >
                +1 Day
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addDays(7)}
                className="text-xs"
              >
                +1 Week
              </Button>
            </div>

            {/* Backward Controls */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addHours(-1)}
                className="text-xs"
              >
                -1 Hour
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addDays(-1)}
                className="text-xs"
              >
                -1 Day
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addDays(-7)}
                className="text-xs"
              >
                -1 Week
              </Button>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            size="sm"
            variant="destructive"
            onClick={resetTimeOffset}
            className="w-full text-xs"
            disabled={!isActive}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset to Real Time
          </Button>

          {/* Info Text */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Time offset persists across page reloads
          </div>
        </div>
      )}
    </Card>
  );
}
