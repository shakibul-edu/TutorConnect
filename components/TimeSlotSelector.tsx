
import React from 'react';
import MultiSelect from './MultiSelect';
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

  // Map internal short codes to option IDs for MultiSelect
  const selectedIds = DAYS_OPTIONS.filter(d => currentDays.includes(d.value)).map(d => d.id);

  const handleDayChange = (ids: number[]) => {
    // Map selected IDs back to day values ('Mon', 'Tue'...)
    const newDays = DAYS_OPTIONS.filter(d => ids.includes(d.id)).map(d => d.value);
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
         <MultiSelect
            label="Select Days"
            options={DAYS_OPTIONS}
            selectedIds={selectedIds}
            onChange={handleDayChange}
            placeholder="Choose days (e.g. Mon, Wed)"
         />
      </div>
      
      <div className="flex items-center gap-4 bg-white p-3 border border-gray-200 rounded-md shadow-sm">
        <Clock className="w-4 h-4 text-gray-400" />
        <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 group">
                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-gray-500 group-focus-within:text-indigo-600 transition-colors">Start Time</label>
                <input
                    type="time"
                    value={start}
                    onChange={(e) => handleTimeChange('start', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700 bg-transparent"
                />
            </div>
            <span className="text-gray-400 font-medium">-</span>
            <div className="relative flex-1 group">
                <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-gray-500 group-focus-within:text-indigo-600 transition-colors">End Time</label>
                <input
                    type="time"
                    value={end}
                    onChange={(e) => handleTimeChange('end', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-700 bg-transparent"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotSelector;
