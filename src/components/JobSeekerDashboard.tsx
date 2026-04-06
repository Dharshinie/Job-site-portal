import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Application } from '../lib/supabase';
import { Search, Briefcase, LogOut, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export function JobSeekerDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'profile' | 'applications'>('search');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    skills: '',
    experience: '',
    phone: '',
    location: '',
    bio: '',
  });

  useEffect(() => {
    loadJobs();
    loadApplications();
    loadProfile();
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, company:companies(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) setJobs(data);
  };

  const loadApplications = async () => {
    const { data } = await supabase
      .from('applications')
      .select('*, job:jobs(*, company:companies(*))')
      .eq('job_seeker_id', profile?.id)
      .order('applied_at', { ascending: false });

    if (data) setApplications(data);
  };

  const loadProfile = async () => {
    const { data } = await supabase
      .from('job_seeker_profiles')
      .select('*')
      .eq('user_id', profile?.id)
      .maybeSingle();

    if (data) {
      setProfileForm({
        skills: data.skills?.join(', ') || '',
        experience: data.experience || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || '',
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const skillsArray = profileForm.skills.split(',').map(s => s.trim()).filter(s => s);

    const { error } = await supabase
      .from('job_seeker_profiles')
      .update({
        skills: skillsArray,
        experience: profileForm.experience,
        phone: profileForm.phone,
        location: profileForm.location,
        bio: profileForm.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile?.id);

    if (!error) {
      loadProfile();
    }

    setLoading(false);
  };

  const handleApply = async (jobId: string) => {
    const { error } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        job_seeker_id: profile?.id,
        status: 'pending',
      });

    if (!error) {
      loadApplications();
      loadJobs();
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasApplied = (jobId: string) => applications.some(app => app.job_id === jobId);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">JobPortal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{profile?.full_name}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5 mr-2" />
            Search Jobs
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'profile'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <User className="w-5 h-5 mr-2" />
            My Profile
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'applications'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-5 h-5 mr-2" />
            My Applications
          </button>
        </div>

        {activeTab === 'search' && (
          <div>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by job title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-gray-600 mb-2">{job.company?.name}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {job.job_type}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {job.location}
                        </span>
                        {job.salary_range && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {job.salary_range}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-6 py-2 rounded-lg font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={hasApplied(job.id)}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                          hasApplied(job.id)
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {hasApplied(job.id) ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredJobs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No jobs found for your search.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-6">My Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={profileForm.skills}
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  placeholder="e.g., JavaScript, React, Node.js"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience
                </label>
                <textarea
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                  placeholder="Describe your work experience..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'applications' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Applications</h2>
            <div className="grid gap-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {app.job?.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{app.job?.company?.name}</p>
                      <p className="text-sm text-gray-500">
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {app.status === 'pending' && (
                        <span className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full">
                          <Clock className="w-4 h-4 mr-2" />
                          Pending
                        </span>
                      )}
                      {app.status === 'accepted' && (
                        <span className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accepted
                        </span>
                      )}
                      {app.status === 'rejected' && (
                        <span className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full">
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <p className="text-center text-gray-500 py-8">No applications yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedJob.company?.name}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {selectedJob.job_type}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  {selectedJob.location}
                </span>
                {selectedJob.salary_range && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {selectedJob.salary_range}
                  </span>
                )}
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                  {selectedJob.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {selectedJob.requirements || 'No specific requirements provided.'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Details</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">Company:</span> {selectedJob.company?.name || 'N/A'}</p>
                  <p><span className="font-medium">Industry:</span> {selectedJob.company?.industry || 'N/A'}</p>
                  <p><span className="font-medium">Location:</span> {selectedJob.company?.location || selectedJob.location}</p>
                  <p><span className="font-medium">Website:</span> {selectedJob.company?.website || 'N/A'}</p>
                  <p><span className="font-medium">About:</span> {selectedJob.company?.description || 'No company description provided.'}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleApply(selectedJob.id);
                    if (!hasApplied(selectedJob.id)) {
                      setSelectedJob(null);
                    }
                  }}
                  disabled={hasApplied(selectedJob.id)}
                  className={`px-5 py-2 rounded-lg font-medium transition ${
                    hasApplied(selectedJob.id)
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {hasApplied(selectedJob.id) ? 'Already Applied' : 'Apply Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
