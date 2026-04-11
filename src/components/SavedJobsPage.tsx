import { Bookmark } from 'lucide-react';
import { Job } from '../lib/supabase';

interface SavedJobsPageProps {
  savedJobs: Job[];
  hasApplied: (jobId: string) => boolean;
  handleToggleSaveJob: (jobId: string) => void;
  handleApply: (jobId: string) => void;
  setSelectedJob: (job: Job) => void;
  onBack: () => void;
}

export function SavedJobsPage({
  savedJobs,
  hasApplied,
  handleToggleSaveJob,
  handleApply,
  setSelectedJob,
  onBack,
}: SavedJobsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700">
            <Bookmark className="h-5 w-5" />
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Saved Jobs</p>
          </div>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">Your shortlist</h1>
          <p className="mt-2 text-sm text-gray-600">
            These are the roles you saved for later review. Apply when you're ready.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            {savedJobs.length} saved job{savedJobs.length === 1 ? '' : 's'}
          </div>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to search
          </button>
        </div>
      </div>

      {savedJobs.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {savedJobs.map((job) => (
            <div key={job.id} className="rounded-2xl border border-gray-200 p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">{job.company?.name || 'Company not listed'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSaveJob(job.id)}
                  className="rounded-full bg-amber-100 p-2 text-amber-700 transition hover:bg-amber-200"
                  aria-label={`Remove ${job.title} from saved jobs`}
                >
                  <Bookmark className="h-4 w-4 fill-current" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{job.job_type}</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{job.location}</span>
                {job.salary_range && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">{job.salary_range}</span>
                )}
              </div>

              <p className="mt-4 text-sm text-gray-700 line-clamp-3">{job.description}</p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setSelectedJob(job)}
                  className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => handleApply(job.id)}
                  disabled={hasApplied(job.id)}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition ${
                    hasApplied(job.id)
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {hasApplied(job.id) ? 'Applied' : 'Apply'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          No saved jobs yet. Use the Save button on any job card to add roles to your shortlist.
        </div>
      )}
    </div>
  );
}
