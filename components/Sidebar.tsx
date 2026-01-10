import React, { useState } from "react";
import TimeSlotSelector from "./TimeSlotSelector";

export interface FilterState {
  postId: string;
  schedule: { start: string; end: string; days: string[] } | undefined;
  feeRange: number;
  gender: string;
  tuitionType: string;
  distance: number;
}

interface SidebarProps {
  onApplyFilter: (filters: FilterState) => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onApplyFilter, className = "" }) => {
  const [postId, setPostId] = useState("");
  const [schedule, setSchedule] = useState<{ start: string; end: string; days: string[] } | undefined>(undefined);
  const [feeRange, setFeeRange] = useState(15000);
  const [gender, setGender] = useState("Any");
  const [tuitionType, setTuitionType] = useState("All Tuition");
  const [distance, setDistance] = useState(10);

  const handleApply = () => {
    onApplyFilter({
      postId,
      schedule,
      feeRange,
      gender,
      tuitionType,
      distance,
    });
  };

  return (
    <div className={`bg-white shadow-sm border border-gray-200 rounded-lg p-5 h-fit ${className}`}>
      <h1 className="font-bold text-gray-900 text-xl mb-6 border-b border-gray-100 pb-4">
        Advance Filter
      </h1>

      {/* Post ID */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Search ID</h3>
        <input
          type="text"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          placeholder="Enter ID"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Schedule */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Search By Schedule
        </h3>
        <TimeSlotSelector value={schedule} onChange={setSchedule} />
      </div>

      {/* Fee Range */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Max Salary</h3>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{feeRange} Tk</span>
        </div>
        <div className="relative pt-2">
          <input
            type="range"
            min={500}
            max={25000}
            step={500}
            value={feeRange}
            onChange={(e) => setFeeRange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs font-medium text-gray-400 mt-2">
             <span>500</span>
             <span>25k+</span>
          </div>
        </div>
      </div>

      {/* Gender Preference */}
      <div className="mb-6">
        <div className="border border-gray-200 rounded-lg p-3">
          <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Gender Preference
          </legend>
          <div className="space-y-2">
            {["Any", "Male", "Female"].map((g) => (
                <label key={g} className="flex items-center cursor-pointer">
                <input
                    type="radio"
                    name="gender"
                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    checked={gender === g}
                    onChange={() => setGender(g)}
                />
                <span className="ml-2 text-sm text-gray-700">{g}</span>
                </label>
            ))}
          </div>
        </div>
      </div>

      {/* Tuition Type */}
      <div className="mb-6">
         <div className="border border-gray-200 rounded-lg p-3">
           <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
             Tuition Type
           </legend>
            <div className="space-y-2">
                {["All Tuition", "Online", "Home"].map((type) => (
                    <label key={type} className="flex items-center cursor-pointer">
                    <input
                        type="radio"
                        name="tuitionType"
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        checked={tuitionType === type}
                        onChange={() => setTuitionType(type)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                ))}
            </div>
         </div>
      </div>

      {/* Nearby */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Distance</h3>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{distance} km</span>
        </div>
        <div className="relative pt-2">
          <input
             type="range"
             min={1}
             max={20}
             value={distance}
             onChange={(e) => setDistance(Number(e.target.value))}
             className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
           />
           <div className="flex justify-between text-xs font-medium text-gray-400 mt-2">
             <span>1 km</span>
             <span>20 km</span>
           </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleApply}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Apply Filter
        </button>
      </div>
    </div>
  );
};

export default Sidebar;