import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Star, Send } from 'lucide-react';
import { submitReview, updateReview } from '../services/backend';
import { TeacherReview } from '../types';

interface ContactRequestReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactRequestId: number;
  tutorName: string;
  onSuccess?: () => void;
  review?: TeacherReview;
  readOnly?: boolean;
}

const ContactRequestReviewModal: React.FC<ContactRequestReviewModalProps> = ({
  isOpen,
  onClose,
  contactRequestId,
  tutorName,
  onSuccess,
  review,
  readOnly = false,
}) => {
  const { data: session } = useSession();
  const [rating, setRating] = useState(review ? review.rating : 5);
  const [comment, setComment] = useState(review ? review.comment : '');
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update state when review prop changes
  useEffect(() => {
    if (review) {
      setRating(review.rating);
      setComment(review.comment);
    } else {
      setRating(5);
      setComment('');
    }
    setError(null);
  }, [review, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      onClose();
      return;
    }

    const token = (session as any)?.backendAccess;
    if (!token) {
      setError('You must be logged in to submit a review');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (review) {
        // Update existing review
        await updateReview(token, review.id, {
          rating,
          comment,
          contact_request: contactRequestId,
        });
      } else {
        // Create new review
        await submitReview(token, {
          rating,
          comment,
          contact_request: contactRequestId,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {readOnly ? 'Review Details' : 'Review Tutor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="text-center">
            <p className="text-gray-600 mb-2">
              {readOnly ? `Review for ` : `How was your experience with `}
              <span className="font-bold text-gray-900">{tutorName}</span>?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => !readOnly && setRating(star)}
                  onMouseEnter={() => !readOnly && setHover(star)}
                  onMouseLeave={() => !readOnly && setHover(0)}
                  className={`focus:outline-none transition-transform ${
                    !readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                  }`}
                  disabled={readOnly}
                >
                  <Star
                    className={`w-10 h-10 ${
                      (hover || rating) >= star
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {readOnly ? 'Comments' : 'Your Feedback'}
            </label>
            {readOnly ? (
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 italic min-h-[100px]">
                "{comment}"
              </div>
            ) : (
              <textarea
                required
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Write a few words about the teaching quality, punctuality, etc."
              />
            )}
          </div>

          <div className="flex gap-3">
            {!readOnly && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-2 border rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-2 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 ${
                readOnly
                  ? 'bg-gray-800 text-white hover:bg-gray-900'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60'
              }`}
            >
              {readOnly ? (
                'Close'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {loading ? 'Submitting...' : review ? 'Update Review' : 'Submit Review'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactRequestReviewModal;
