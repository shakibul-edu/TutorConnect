
import React, { useState } from 'react';
import { Education } from '../../types';
import { FileText, X, Plus, Upload, Loader2, Lock } from 'lucide-react';
import { educationSchema } from '../TeacherProfileForm';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-hot-toast';

interface EducationSectionProps {
  educationList: Education[];
  setEducationList: (list: Education[]) => void;
  error?: string;
  profileId: number | null;
  onAddEducation: (edu: Education) => Promise<void>;
}

const EducationSection: React.FC<EducationSectionProps> = ({ educationList, setEducationList, error, profileId, onAddEducation }) => {
  const { t } = useLanguage();
  const [newEducation, setNewEducation] = useState<Education>({
    institution: '',
    degree: '',
    year: '',
    result: '',
    certificate: undefined
  });

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const addEducation = async () => {
    setLocalError(null);
    
    // Validate single entry
    const result = educationSchema.safeParse(newEducation);
    if (!result.success) {
        setLocalError(result.error.issues[0].message);
        return;
    }

    if (!profileId) {
        toast.error("Please create your profile first.");
        return;
    }

    setSubmitting(true);
    try {
        await onAddEducation(newEducation);
        // Clear form on success
        setNewEducation({ institution: '', degree: '', year: '', result: '', certificate: undefined });
    } catch (e) {
        // Error handled in parent
    } finally {
        setSubmitting(false);
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
        <h2 className="text-xl font-bold text-gray-900">{t.education.title}</h2>
        <p className="text-gray-500 text-sm">Your academic profiles</p>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
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

      <div className={`bg-white border border-gray-200 rounded-lg p-5 relative ${!profileId ? 'opacity-50 pointer-events-none' : ''}`}>
        {!profileId && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/50">
                <div className="bg-white p-3 rounded-md shadow-md flex items-center gap-2 border border-gray-200">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{t.education.saveUnlock}</span>
                </div>
            </div>
        )}

        <h3 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">{t.education.title}</h3>
        {localError && <p className="text-red-500 text-sm mb-3">{localError}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.education.degree} *</label>
            <input
              placeholder="e.g., SSC, HSC, BSc"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.degree}
              onChange={e => setNewEducation({ ...newEducation, degree: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.education.institution} *</label>
            <input
              placeholder="Institution Name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.institution}
              onChange={e => setNewEducation({ ...newEducation, institution: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.education.result} *</label>
            <input
              placeholder="e.g., GPA 5.0"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.result}
              onChange={e => setNewEducation({ ...newEducation, result: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500">{t.education.passingYear} *</label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              value={newEducation.year}
              onChange={e => setNewEducation({ ...newEducation, year: e.target.value })}
            >
              <option value="">{t.actions.selectYear}</option>
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-gray-500">{t.education.certificate}</label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer flex items-center justify-center w-full px-4 py-2 border border-gray-300 border-dashed rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                <Upload className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {newEducation.certificate instanceof File ? newEducation.certificate.name : t.education.uploadDoc}
                </span>
                <input type="file" className="hidden" accept="image/*" onChange={handleEducationFileChange} />
              </label>
            </div>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={addEducation}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70"
          >
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {t.actions.saveAdd}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationSection;
