
import React, { useState } from 'react';
import { Education } from '../../types';
import { FileText, X, Plus, Upload } from 'lucide-react';

interface EducationSectionProps {
  educationList: Education[];
  setEducationList: (list: Education[]) => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({ educationList, setEducationList }) => {
  const [newEducation, setNewEducation] = useState<Education>({
    institution: '',
    degree: '',
    year: '',
    result: '',
    certificate: undefined
  });

  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setEducationList([...educationList, { ...newEducation }]);
      setNewEducation({ institution: '', degree: '', year: '', result: '', certificate: undefined });
    }
  };

  const removeEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  const handleEducationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewEducation({ ...newEducation, certificate: e.target.files[0] });
    }
  };

  const yearOptions = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Educational Info</h2>
        <p className="text-gray-500 text-sm">Your academic profiles</p>
      </div>

      {educationList.length > 0 && (
        <div className="mb-6 space-y-3">
          {educationList.map((edu, idx) => (
            <div key={idx} className="flex justify-between items-start p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div>
                <p className="font-semibold text-gray-900">{edu.degree}</p>
                <p className="text-sm text-gray-600">{edu.institution}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Year: {edu.year}</span>
                  <span>Result: {edu.result}</span>
                  {edu.certificate && (
                    <span className="flex items-center gap-1 text-indigo-600">
                      <FileText className="w-3 h-3" />
                      <a href={typeof edu.certificate === 'string' ? edu.certificate : '#'} target="_blank" className="underline">View Certificate</a>
                    </span>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => removeEducation(idx)} className="text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">Add New Academic Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Degree</label>
            <input
              placeholder="e.g., SSC, HSC, BSc"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.degree}
              onChange={e => setNewEducation({ ...newEducation, degree: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Institution</label>
            <input
              placeholder="Institution Name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.institution}
              onChange={e => setNewEducation({ ...newEducation, institution: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Result</label>
            <input
              placeholder="e.g., GPA 5.0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.result}
              onChange={e => setNewEducation({ ...newEducation, result: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Passing Year</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.year}
              onChange={e => setNewEducation({ ...newEducation, year: e.target.value })}
            >
              <option value="">Select Year</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-gray-500">Certificate</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                <Upload className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {newEducation.certificate instanceof File ? newEducation.certificate.name : 'Upload Document'}
                </span>
                <input type="file" className="hidden" onChange={handleEducationFileChange} />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Save & Add Another
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationSection;
