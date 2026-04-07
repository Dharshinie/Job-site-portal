import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Company, Job, Application } from '../lib/supabase';
import { Building2, Briefcase, LogOut, Users, Plus, X } from 'lucide-react';
import { DashboardProfileButton } from './DashboardProfileButton';

export function RecruiterDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'company' | 'jobs' | 'applicants'>('company');
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: '',
    description: '',
    industry: '',
    location: '',
    website: '',
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    job_type: 'full-time' as const,
    salary_range: '',
  });

  useEffect(() => {
    if (!profile?.id) return;

    loadCompany();
    loadJobs();
    loadApplications();
  }, [profile?.id]);

  const loadCompany = async () => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('recruiter_id', profile?.id)
      .maybeSingle();

    if (data) {
      setCompany(data);
      setCompanyForm({
        name: data.name,
        description: data.description,
        industry: data.industry,
        location: data.location,
        website: data.website,
      });
    }
  };

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*')
      .eq('recruiter_id', profile?.id)
      .order('created_at', { ascending: false });

    if (data) setJobs(data);
  };

  const loadApplications = async () => {
    if (jobs.length === 0) {
      setApplications([]);
      return;
    }

    const { data } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(*),
        job_seeker:user_profiles!applications_job_seeker_id_fkey(
          *,
          job_seeker_profile:job_seeker_profiles(*)
        )
      `)
      .in('job_id', jobs.map(j => j.id))
      .order('applied_at', { ascending: false });

    if (data) setApplications(data);
  };

  useEffect(() => {
    if (profile?.id && jobs.length > 0) {
      loadApplications();
    }

    if (profile?.id && jobs.length === 0) {
      setApplications([]);
    }
  }, [jobs.length, profile?.id]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (company) {
      const { error } = await supabase
        .from('companies')
        .update({
          ...companyForm,
          updated_at: new Date().toISOString(),
        })
        .eq('id', company.id);

      if (!error) loadCompany();
    } else {
      const { error } = await supabase
        .from('companies')
        .insert({
          ...companyForm,
          recruiter_id: profile?.id,
        });

      if (!error) loadCompany();
    }

    setLoading(false);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);

    const { error } = await supabase
      .from('jobs')
      .insert({
        ...jobForm,
        company_id: company.id,
        recruiter_id: profile?.id,
        status: 'active',
      });

    if (!error) {
      loadJobs();
      setShowJobForm(false);
      setJobForm({
        title: '',
        description: '',
        requirements: '',
        location: '',
        job_type: 'full-time',
        salary_range: '',
      });
    }

    setLoading(false);
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('applications')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (!error) {
      loadApplications();
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId);

    if (!error) {
      loadJobs();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">JobPortal - Recruiter</h1>
            </div>
            <div className="flex items-center space-x-4">
      
              <DashboardProfileButton
                profile={profile}
                accentColorClass="text-blue-600"
                companyName={company?.name}
              />
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
            onClick={() => setActiveTab('company')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'company'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-5 h-5 mr-2" />
            Company Profile
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'jobs'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Job Posts
          </button>
          <button
            onClick={() => setActiveTab('applicants')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'applicants'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Applicants
          </button>
        </div>

        {activeTab === 'company' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-6">Company Profile</h2>
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={companyForm.industry}
                    onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={companyForm.location}
                    onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : company ? 'Update Company' : 'Create Company'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Job Posts</h2>
              {company && (
                <button
                  onClick={() => setShowJobForm(!showJobForm)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {showJobForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                  {showJobForm ? 'Cancel' : 'Post New Job'}
                </button>
              )}
            </div>

            {!company && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6">
                Please create a company profile first before posting jobs.
              </div>
            )}

            {showJobForm && company && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-xl font-semibold mb-4">Create New Job</h3>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={jobForm.description}
                      onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirements
                    </label>
                    <textarea
                      value={jobForm.requirements}
                      onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Type
                      </label>
                      <select
                        value={jobForm.job_type}
                        onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value as any })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={jobForm.location}
                        onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Salary Range
                      </label>
                      <input
                        type="text"
                        value={jobForm.salary_range}
                        onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })}
                        placeholder="e.g., $60k-$80k"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Job'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          job.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {job.job_type}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {job.location}
                        </span>
                      </div>
                      <p className="text-gray-700">{job.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggleJobStatus(job.id, job.status)}
                      className={`ml-4 px-4 py-2 rounded-lg transition ${
                        job.status === 'active'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {job.status === 'active' ? 'Close' : 'Reopen'}
                    </button>
                  </div>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No jobs posted yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'applicants' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Applicants</h2>
            <div className="grid gap-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {app.applicant_name || app.job_seeker?.full_name}
                      </h3>
                      <p className="text-gray-600 mb-2">Applied for: {app.job?.title}</p>
                      <p className="text-sm text-gray-600 mb-1">
                        Email: {app.applicant_email || app.job_seeker?.email || 'Not provided'}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                      {(app.applicant_skills?.length || app.job_seeker?.job_seeker_profile?.skills?.length) && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(app.applicant_skills?.length
                            ? app.applicant_skills
                            : app.job_seeker?.job_seeker_profile?.skills || []).map((skill: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 mb-3 text-sm text-gray-700">
                        <p>
                          <span className="font-medium text-gray-900">Reference option:</span>{' '}
                          {app.reference_option === 'contact_details_provided'
                            ? 'Contact details provided'
                            : app.reference_option === 'attached_in_resume'
                              ? 'Attached in resume'
                              : 'Available on request'}
                        </p>
                        {app.reference_details && (
                          <p>
                            <span className="font-medium text-gray-900">Reference details:</span>{' '}
                            {app.reference_details}
                          </p>
                        )}
                        {app.resume_data_url && (
                          <a
                            href={app.resume_data_url}
                            download={app.resume_file_name || `${app.applicant_name || 'candidate'}-resume`}
                            className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 font-medium text-gray-800 transition hover:bg-gray-200"
                          >
                            Download Resume
                          </a>
                        )}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        app.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </div>
                    )}
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
    </div>
  );
}
