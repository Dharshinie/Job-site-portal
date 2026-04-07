import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, UserProfile, Job } from '../lib/supabase';
import { Shield, Users, Briefcase, LogOut, BarChart3 } from 'lucide-react';
import { DashboardProfileButton } from './DashboardProfileButton';

export function AdminDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'analytics'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    jobSeekers: 0,
    recruiters: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
  });

  useEffect(() => {
    loadUsers();
    loadJobs();
    loadStats();
  }, []);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setUsers(data);
  };

  const loadJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, company:companies(*)')
      .order('created_at', { ascending: false });

    if (data) setJobs(data);
  };

  const loadStats = async () => {
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: jobSeekers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'job_seeker');

    const { count: recruiters } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'recruiter');

    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true });

    const { count: activeJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: totalApplications } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: totalUsers || 0,
      jobSeekers: jobSeekers || 0,
      recruiters: recruiters || 0,
      totalJobs: totalJobs || 0,
      activeJobs: activeJobs || 0,
      totalApplications: totalApplications || 0,
    });
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (!error) {
        loadJobs();
        loadStats();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-red-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              
              <DashboardProfileButton profile={profile} accentColorClass="text-red-600" />
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
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'users'
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'jobs'
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Jobs
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition ${
              activeTab === 'analytics'
                ? 'bg-red-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Analytics
          </button>
        </div>

        {activeTab === 'analytics' && (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="h-10 w-10 shrink-0 text-blue-500 sm:h-12 sm:w-12" />
              </div>
              <div className="mt-4 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
                <span className="text-gray-600">Job Seekers: {stats.jobSeekers}</span>
                <span className="text-gray-600">Recruiters: {stats.recruiters}</span>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
                <Briefcase className="h-10 w-10 shrink-0 text-green-500 sm:h-12 sm:w-12" />
              </div>
              <div className="mt-4 text-sm">
                <span className="text-gray-600">Active: {stats.activeJobs}</span>
              </div>
            </div>

            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalApplications}</p>
                </div>
                <BarChart3 className="h-10 w-10 shrink-0 text-purple-500 sm:h-12 sm:w-12" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'recruiter' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Job Management</h2>
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <p className="text-gray-600 mb-2">{job.company?.name}</p>
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
                      <p className="text-gray-700 text-sm">{job.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
