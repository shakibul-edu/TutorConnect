
import React from "react";
import TimeSlotSelector from "./TimeSlotSelector";
import { Plus, Trash2, CalendarClock } from "lucide-react";
import { AvailabilitySlot } from "../types";

interface AvailabilityProps {
  slots: AvailabilitySlot[];
  setSlots: (slots: AvailabilitySlot[]) => void;
}

const Availability: React.FC<AvailabilityProps> = ({ slots, setSlots }) => {
  const updateSlot = (i: number, next: AvailabilitySlot) =>
    setSlots(slots.map((s, idx) => (idx === i ? next : s)));

  const addSlot = () =>
    setSlots([...slots, { start: "16:00", end: "21:00", days: [] }]);

  const removeSlot = (i: number) =>
    setSlots(slots.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {slots.map((slot, i) => (
        <div key={i} className="group relative bg-white hover:shadow-md transition-all duration-200 p-5 rounded-lg border border-gray-200">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() => removeSlot(i)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Remove slot"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            
            <div className="mb-2 flex items-center gap-2 text-indigo-600 font-medium text-sm">
                <CalendarClock className="w-4 h-4" />
                <span>Schedule {i + 1}</span>
            </div>

            <div className="pr-2">
               <TimeSlotSelector value={slot} onChange={(s) => updateSlot(i, s)} />
            </div>
        </div>
      ))}
      
      <button
        type="button"
        onClick={addSlot}
        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 p-4 rounded-lg transition-all font-medium"
      >
        <Plus className="w-5 h-5" />
        Add New Schedule
      </button>
    </div>
  );
};

export default Availability;
