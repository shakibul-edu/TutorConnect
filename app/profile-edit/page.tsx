import React from 'react';
import TeacherProfileForm from '../../components/TeacherProfileForm';
import { useAuth } from '../../lib/auth';

const ProfileEditPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h2 className="text-xl font-semibold text-gray-900">Please log in to edit your profile.</h2>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherProfileForm />
    </div>
  );
};

export default ProfileEditPage;
