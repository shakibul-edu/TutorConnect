import React, { useEffect, useRef, useState } from "react";
import { useSession } from 'next-auth/react';
import TimeSlotSelector from "./TimeSlotSelector";
import MultiSelect from './MultiSelect';
import { Grade, Medium, Subject } from '../types';
import { getGradesbyMedium, getMediums, getSubjects } from '../services/backend';

export interface FilterState {
  postId: string;
  schedule: { start: string; end: string; days: string[] } | undefined;
  feeRange: number;
  gender: string;
  tuitionType: string;
  distance: number;
  medium_list?: number[];
  grade_list?: number[];
  subject_list?: number[];
}

export const DEFAULT_FILTER_STATE: FilterState = {
  postId: "",
  schedule: undefined,
  feeRange: 25000,
  gender: "Any",
  tuitionType: "All Tuition",
  distance: 20,
  medium_list: [],
  grade_list: [],
  subject_list: [],
};

interface SidebarProps {
  onApplyFilter: (filters: FilterState) => void;
  className?: string;
  academicFilters?: boolean;
  resetSignal?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ onApplyFilter, className = "", academicFilters = false, resetSignal }) => {
  const { data: session, status } = useSession();
  const [postId, setPostId] = useState("");
  const [schedule, setSchedule] = useState<{ start: string; end: string; days: string[] } | undefined>(undefined);
  const [feeRange, setFeeRange] = useState(15000);
  const [gender, setGender] = useState("Any");
  const [tuitionType, setTuitionType] = useState("All Tuition");
  const [distance, setDistance] = useState(10);
  const [selectedMediums, setSelectedMediums] = useState<number[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [mediumOptions, setMediumOptions] = useState<Medium[]>([]);
  const [gradeOptions, setGradeOptions] = useState<Grade[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Subject[]>([]);
  const lastResetSignal = useRef<number | undefined>(resetSignal);

  const token = (session as any)?.backendAccess;

  const clearLocalFilters = () => {
    setPostId("");
    setSchedule(undefined);
    setFeeRange(DEFAULT_FILTER_STATE.feeRange);
    setGender(DEFAULT_FILTER_STATE.gender);
    setTuitionType(DEFAULT_FILTER_STATE.tuitionType);
    setDistance(DEFAULT_FILTER_STATE.distance);
    setSelectedMediums([]);
    setSelectedGrades([]);
    setSelectedSubjects([]);
  };

  const applyDefaultFilters = () => {
    clearLocalFilters();
    onApplyFilter(DEFAULT_FILTER_STATE);
  };

  useEffect(() => {
    if (!academicFilters) return;

    getMediums(token)
      .then((data) => {
        const nextOptions = Array.isArray(data) ? data : data?.results || [];
        setMediumOptions(nextOptions);
      })
      .catch((error) => console.error('Failed to load mediums', error));
  }, [academicFilters, token]);

  useEffect(() => {
    if (!academicFilters) return;

    const loadGrades = async () => {
      if (selectedMediums.length === 0) {
        setGradeOptions([]);
        setSelectedGrades([]);
        setSubjectOptions([]);
        setSelectedSubjects([]);
        return;
      }

      try {
        const data = await getGradesbyMedium(token, { medium_id: selectedMediums.map(String) });
        const nextGrades = Array.isArray(data) ? data : data?.results || [];
        setGradeOptions(nextGrades);
        setSelectedGrades((current) => current.filter((gradeId) => nextGrades.some((grade) => grade.id === gradeId)));
      } catch (error) {
        console.error('Failed to load grades', error);
        setGradeOptions([]);
        setSelectedGrades([]);
        setSubjectOptions([]);
        setSelectedSubjects([]);
      }
    };

    loadGrades();
  }, [academicFilters, token, selectedMediums]);

  useEffect(() => {
    if (!academicFilters) return;

    const loadSubjects = async () => {
      if (selectedGrades.length === 0) {
        setSubjectOptions([]);
        setSelectedSubjects([]);
        return;
      }

      try {
        const data = await getSubjects(token, { grade_id: selectedGrades.map(String) });
        const nextSubjects = Array.isArray(data) ? data : data?.results || [];
        setSubjectOptions(nextSubjects);
        setSelectedSubjects((current) => current.filter((subjectId) => nextSubjects.some((subject) => subject.id === subjectId)));
      } catch (error) {
        console.error('Failed to load subjects', error);
        setSubjectOptions([]);
        setSelectedSubjects([]);
      }
    };

    loadSubjects();
  }, [academicFilters, token, selectedGrades]);

  useEffect(() => {
    if (resetSignal === undefined) return;
    if (lastResetSignal.current === undefined) {
      lastResetSignal.current = resetSignal;
      return;
    }

    if (lastResetSignal.current !== resetSignal) {
      lastResetSignal.current = resetSignal;
      clearLocalFilters();
    }
  }, [resetSignal]);

  const handleApply = () => {
    onApplyFilter({
      postId,
      schedule,
      feeRange,
      gender,
      tuitionType,
      distance,
      medium_list: selectedMediums,
      grade_list: selectedGrades,
      subject_list: selectedSubjects,
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

      {academicFilters && (
        <>
          <div className="mb-6">
            <MultiSelect
              label="Medium"
              options={mediumOptions}
              selectedIds={selectedMediums}
              onChange={setSelectedMediums}
              placeholder="Select medium(s)"
            />
          </div>

          <div className="mb-6">
            <MultiSelect
              label="Grade / Class"
              options={gradeOptions}
              selectedIds={selectedGrades}
              onChange={setSelectedGrades}
              placeholder="Select grade(s)"
            />
          </div>

          <div className="mb-6">
            <MultiSelect
              label="Subject"
              options={subjectOptions}
              selectedIds={selectedSubjects}
              onChange={setSelectedSubjects}
              placeholder="Select subject(s)"
            />
          </div>
        </>
      )}

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
                    checked={gender === g.toLocaleLowerCase()}
                    onChange={() => setGender(g.toLocaleLowerCase())}
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
                {["Any", "Online", "Offline"].map((type) => (
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
        <button
          onClick={applyDefaultFilters}
          className="w-full mt-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default Sidebar;