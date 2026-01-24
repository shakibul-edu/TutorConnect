import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '../lib/auth';
import { toast } from '../lib/toast';
import { submitContactRequest } from '../services/backend';
import { X, Send, Loader2 } from 'lucide-react';

interface ContactRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
}

const ContactRequestModal: React.FC<ContactRequestModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
}) => {
  const { user } = useAuth();
  // @ts-ignore
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    student_name: user?.first_name && user?.last_name 
      ? `${user.first_name} ${user.last_name}` 
      : user?.username || '',
    student_phone: '',
    fee_budget: '',
    message: '',
  });

  // @ts-ignore
  const token = (session as any)?.backendAccess;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('You must be logged in to send a contact request.');
      return;
    }

    if (!formData.student_name.trim() || !formData.student_phone.trim() || !formData.fee_budget.trim() || !formData.message.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }

    const budgetNumber = Number(formData.fee_budget);
    if (Number.isNaN(budgetNumber) || budgetNumber <= 0) {
      toast.error('Enter a valid fee budget.');
      return;
    }

    setLoading(true);

    try {
      const response = await submitContactRequest(token, {
        student_name: formData.student_name,
        student_phone: formData.student_phone,
        fee_budget: budgetNumber,
        message: formData.message,
        teacher: Number(teacherId),
      });

      if (response) {
        toast.success('Contact request sent successfully!');
        setFormData({
          student_name: user?.first_name && user?.last_name 
            ? `${user.first_name} ${user.last_name}` 
            : user?.username || '',
          student_phone: '',
          fee_budget: '',
          message: '',
        });
        onClose();
      }
    } catch (error) {
      console.error('Error submitting contact request:', error);
      // Error message is already formatted by FetchApi.parseErrorResponse
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Contact Request</h2>
            <p className="text-sm text-gray-500 mt-1">Send a message to {teacherName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="student_phone"
              value={formData.student_phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Your phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fee Budget (BDT)
            </label>
            <input
              type="number"
              name="fee_budget"
              value={formData.fee_budget}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 5000"
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Write your message to the teacher..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactRequestModal;
