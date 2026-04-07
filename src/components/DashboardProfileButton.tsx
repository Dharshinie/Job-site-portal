import { User, X } from 'lucide-react';
import { useState } from 'react';
import { UserProfile, JobSeekerProfile } from '../lib/supabase';

interface DashboardProfileButtonProps {
  profile: UserProfile | null;
  accentColorClass: string;
  extraProfile?: JobSeekerProfile | null;
  companyName?: string;
  onEdit?: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  recruiter: 'Recruiter',
  job_seeker: 'Job Seeker',
};

export function DashboardProfileButton({
  profile,
  accentColorClass,
  extraProfile,
  companyName,
  onEdit,
}: DashboardProfileButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center text-gray-600 hover:text-gray-900"
        aria-label="Open profile details"
      >
        <User className="w-5 h-5" />
      </button>

      {open && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-start justify-between border-b border-gray-200 p-6">
              <div>
                <p className={`text-sm font-semibold ${accentColorClass}`}>Profile Details</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">{profile.full_name}</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close profile details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6 text-sm text-gray-700">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-gray-500">Email</p>
                  <p className="mt-1 font-medium text-gray-900">{profile.email}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-gray-500">Role</p>
                  <p className="mt-1 font-medium text-gray-900">{roleLabels[profile.role] || profile.role}</p>
                </div>
              </div>

              {companyName && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-gray-500">Company</p>
                  <p className="mt-1 font-medium text-gray-900">{companyName}</p>
                </div>
              )}

              {extraProfile && (
                <>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-gray-500">Skills</p>
                    <p className="mt-1 font-medium text-gray-900">
                      {extraProfile.skills?.length ? extraProfile.skills.join(', ') : 'Not added yet'}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-gray-500">Phone</p>
                      <p className="mt-1 font-medium text-gray-900">{extraProfile.phone || 'Not added yet'}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-gray-500">Location</p>
                      <p className="mt-1 font-medium text-gray-900">{extraProfile.location || 'Not added yet'}</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-gray-500">Bio</p>
                    <p className="mt-1 whitespace-pre-line font-medium text-gray-900">
                      {extraProfile.bio || 'Not added yet'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {onEdit && (
              <div className="border-t border-gray-200 p-6 pt-4">
                <button
                  onClick={() => {
                    setOpen(false);
                    onEdit();
                  }}
                  className={`rounded-lg px-4 py-2 font-medium text-white ${accentColorClass.replace('text-', 'bg-')} transition hover:opacity-90`}
                >
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
