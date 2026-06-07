'use client';

import React, { useEffect } from 'react';
import { MapPin, X, Navigation, Shield } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top gradient accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-600" />

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-7">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-50 to-indigo-100 rounded-full flex items-center justify-center ring-4 ring-brand-100">
                <MapPin className="w-8 h-8 text-brand-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                <Navigation className="w-3 h-3 text-white fill-white" />
              </div>
            </div>
          </div>

          {/* Title — bilingual */}
          <h2
            id="location-modal-title"
            className="text-center text-xl font-bold text-gray-900 mb-1 leading-snug"
          >
            লোকেশন কেন দরকার?
          </h2>
          <p className="text-center text-sm text-gray-400 font-medium mb-5">
            Why do we need your location?
          </p>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-5" />

          {/* Body — Bangla */}
          <div className="space-y-3 mb-5">
            <div className="flex gap-3 items-start bg-brand-50 rounded-xl p-3.5">
              <span className="text-xl leading-none mt-0.5">🗺️</span>
              <div>
                <p className="text-sm font-semibold text-brand-900 mb-0.5">
                  আপনার কাছাকাছি টিউটর/টিউশন খুঁজে পেতে
                </p>
                <p className="text-xs text-brand-700 leading-relaxed">
                  আমরা আপনার বর্তমান লোকেশন ব্যবহার করে আশেপাশের সেরা
                  টিউটর ও টিউশন জব দেখাই। লোকেশন ছাড়া কাছের ফলাফল
                  দেখানো সম্ভব নয়।
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-indigo-50 rounded-xl p-3.5">
              <span className="text-xl leading-none mt-0.5">📍</span>
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-0.5">
                  To find tutors &amp; tuitions nearby
                </p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  We use your current location to show you the best tutors
                  and tuition jobs close to you. Without location access, we
                  cannot display nearby results.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Shield className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
            <span>
              আপনার লোকেশন নিরাপদ। শুধুমাত্র কাছের টিউটর খুঁজতে ব্যবহার হয়।
              &nbsp;·&nbsp; Your location is private and only used for nearby matching.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              বাতিল · Cancel
            </button>
            <button
              onClick={onConfirm}
              id="location-modal-confirm"
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              লোকেশন দিন · Allow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPermissionModal;
