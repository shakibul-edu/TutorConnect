
import React from 'react';
import { Clock } from 'lucide-react';

interface TimeSlotSelectorProps {
  value: { start: string; end: string; days: string[] } | undefined;
  onChange: (value: { start: string; end: string; days: string[] }) => void;
}

const DAYS_OPTIONS = [
  { id: 1, name: 'Monday', value: 'Mon' },
  { id: 2, name: 'Tuesday', value: 'Tue' },
  { id: 3, name: 'Wednesday', value: 'Wed' },
  { id: 4, name: 'Thursday', value: 'Thu' },
  { id: 5, name: 'Friday', value: 'Fri' },
  { id: 6, name: 'Saturday', value: 'Sat' },
  { id: 7, name: 'Sunday', value: 'Sun' },
];

const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({ value, onChange }) => {
  const currentDays = value?.days || [];
  const start = value?.start || '';
  const end = value?.end || '';

  const toggleDay = (dayValue: string) => {
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue];
    onChange({ start, end, days: newDays });
  };

  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    onChange({ 
      start: type === 'start' ? val : start, 
      end: type === 'end' ? val : end, 
      days: currentDays 
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Days</label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OPTIONS.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                currentDays.includes(day.value)
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {day.value}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-3 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
        <Clock className="lg:hidden w-4 h-4 text-gray-400 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-1 min-w-[100px] max-w-[140px] group">
                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-gray-500 group-focus-within:text-indigo-600 transition-colors">Start Time</label>
                <input
                    type="time"
                    value={start}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="w-full px-2 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700 bg-transparent"
                />
            </div>
            <span className="text-gray-400 font-medium flex-shrink-0">-</span>
            <div className="relative flex-1 min-w-[100px] max-w-[140px] group">
                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-gray-500 group-focus-within:text-indigo-600 transition-colors">End Time</label>
                <input
                    type="time"
                    value={end}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700 bg-transparent"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotSelector;
