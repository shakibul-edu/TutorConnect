import React from 'react';
import { MapPin, AlertTriangle, X } from 'lucide-react';

interface LocationBannerProps {
  type: 'update' | 'permission';
  message: string;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

const LocationBanner: React.FC<LocationBannerProps> = ({ type, message, onConfirm, onDismiss }) => {
  const isPermission = type === 'permission';

  return (
    <div className={`w-full py-2 px-3 md:py-3 md:px-4 flex items-center justify-between shadow-md relative z-[60] ${
      isPermission ? 'bg-amber-50 border-b border-amber-200' : 'bg-brand-50 border-b border-brand-200'
    }`}>
      <div className="flex items-center gap-2 md:gap-3 container max-w-7xl mx-auto">
        {isPermission ? (
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 hidden sm:block" />
        ) : (
            <MapPin className="w-4 h-4 md:w-5 md:h-5 text-brand-600 flex-shrink-0 hidden sm:block" />
        )}
        
        <p className={`text-xs md:text-sm font-medium flex-grow ${
            isPermission ? 'text-amber-800' : 'text-brand-800'
        }`}>
          {message}
        </p>

        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {onConfirm && (
            <button
              onClick={onConfirm}
              className={`px-2 py-1 md:px-3 md:py-1.5 text-[10px] md:text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                isPermission 
                  ? 'bg-amber-600 text-white hover:bg-amber-700' 
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {isPermission ? 'Enable Location' : 'Update Location'}
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`p-1 rounded-full hover:bg-black/5 transition-colors ${
                isPermission ? 'text-amber-500' : 'text-brand-500'
              }`}
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationBanner;
