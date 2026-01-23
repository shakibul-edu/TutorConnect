
import React, { useState } from 'react';
import { Qualification } from '../../types';
import { FileText, X, Plus, Upload } from 'lucide-react';

interface QualificationSectionProps {
  qualificationList: Qualification[];
  setQualificationList: (list: Qualification[]) => void;
}

const QualificationSection: React.FC<QualificationSectionProps> = ({ qualificationList, setQualificationList }) => {
  const [newQualification, setNewQualification] = useState<Qualification>({
    skill: '',
    organization: '',
    year: '',
    result: '',
    certificate: undefined
  });

  const addQualification = () => {
    if (newQualification.skill && newQualification.organization) {
      setQualificationList([...qualificationList, { ...newQualification }]);
      setNewQualification({ skill: '', organization: '', year: '', result: '', certificate: undefined });
    }
  };

  const removeQualification = (index: number) => {
    setQualificationList(qualificationList.filter((_, i) => i !== index));
  };

  const handleQualificationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewQualification({ ...newQualification, certificate: e.target.files[0] });
    }
  };

  const yearOptions = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Qualifications</h2>
        <p className="text-gray-500 text-sm">Your professional qualifications and skills</p>
      </div>

      {qualificationList.length > 0 && (
        <div className="mb-6 space-y-3">
          {qualificationList.map((qual, idx) => (
            <div key={idx} className="flex justify-between items-start p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div>
                <p className="font-semibold text-gray-900">{qual.skill}</p>
                <p className="text-sm text-gray-600">{qual.organization}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>Year: {qual.year}</span>
                  <span>Result: {qual.result}</span>
                  {qual.certificate && (
                    <span className="flex items-center gap-1 text-indigo-600">
                      <FileText className="w-3 h-3" />
                      <a href={typeof qual.certificate === 'string' ? qual.certificate : '#'} target="_blank" className="underline">View Certificate</a>
                    </span>
                  )}
                </div>
              </div>
              <button type="button" onClick={() => removeQualification(idx)} className="text-gray-400 hover:text-red-500">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">Add New Qualification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Skill / Certification Name</label>
            <input
              placeholder="e.g., IELTS, PMP, Python"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newQualification.skill}
              onChange={e => setNewQualification({ ...newQualification, skill: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Organization</label>
            <input
              placeholder="Organization Name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newQualification.organization}
              onChange={e => setNewQualification({ ...newQualification, organization: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Result</label>
            <input
              placeholder="Score / Grade"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newQualification.result}
              onChange={e => setNewQualification({ ...newQualification, result: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">Passing Year</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newQualification.year}
              onChange={e => setNewQualification({ ...newQualification, year: e.target.value })}
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
                  {newQualification.certificate instanceof File ? newQualification.certificate.name : 'Upload Document'}
                </span>
                <input type="file" className="hidden" onChange={handleQualificationFileChange} />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={addQualification}
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

export default QualificationSection;
