import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Application, JobSeekerProfile } from '../lib/supabase';
import { Search, Briefcase, LogOut, FileText, CheckCircle, XCircle, Clock, ArrowLeft, Upload, X, Bookmark, CalendarDays, ExternalLink, Building2, Sparkles } from 'lucide-react';
import { DashboardProfileButton } from './DashboardProfileButton';
import { SavedJobsPage } from './SavedJobsPage.tsx';

const SKILL_KEYWORDS = [
  { label: 'JavaScript', aliases: ['javascript', 'js'] },
  { label: 'TypeScript', aliases: ['typescript', 'ts'] },
  { label: 'React', aliases: ['react', 'react.js', 'reactjs'] },
  { label: 'Node.js', aliases: ['node', 'node.js', 'nodejs'] },
  { label: 'Express', aliases: ['express', 'express.js', 'expressjs'] },
  { label: 'Next.js', aliases: ['next', 'next.js', 'nextjs'] },
  { label: 'HTML', aliases: ['html', 'html5'] },
  { label: 'CSS', aliases: ['css', 'css3'] },
  { label: 'Tailwind CSS', aliases: ['tailwind', 'tailwindcss', 'tailwind css'] },
  { label: 'Python', aliases: ['python'] },
  { label: 'Java', aliases: ['java'] },
  { label: 'C++', aliases: ['c++', 'cpp'] },
  { label: 'C#', aliases: ['c#', 'csharp'] },
  { label: 'SQL', aliases: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite'] },
  { label: 'MongoDB', aliases: ['mongodb', 'mongo db', 'mongo'] },
  { label: 'Firebase', aliases: ['firebase'] },
  { label: 'Supabase', aliases: ['supabase'] },
  { label: 'Git', aliases: ['git', 'github', 'gitlab'] },
  { label: 'REST APIs', aliases: ['rest api', 'restful api', 'api integration', 'apis'] },
  { label: 'GraphQL', aliases: ['graphql'] },
  { label: 'Docker', aliases: ['docker', 'containerization', 'containers'] },
  { label: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { label: 'AWS', aliases: ['aws', 'amazon web services'] },
  { label: 'Azure', aliases: ['azure'] },
  { label: 'GCP', aliases: ['gcp', 'google cloud'] },
  { label: 'Figma', aliases: ['figma'] },
  { label: 'UI/UX Design', aliases: ['ui/ux', 'ux design', 'ui design', 'user experience'] },
  { label: 'Testing', aliases: ['testing', 'jest', 'vitest', 'cypress', 'playwright'] },
  { label: 'Agile', aliases: ['agile', 'scrum'] },
  { label: 'Communication', aliases: ['communication', 'stakeholder management'] },
  { label: 'Problem Solving', aliases: ['problem solving', 'analytical thinking'] },
];

const applicationCategories = [
  'Software Development',
  'Design',
  'Data & Analytics',
  'Marketing',
  'Sales',
  'Human Resources',
  'Operations',
  'Customer Support',
  'Finance',
  'Other',
] as const;

const experienceLevels = ['Fresher', 'Junior', 'Mid-Level', 'Senior', 'Lead'] as const;
const workModes = ['Remote', 'Hybrid', 'On-site', 'Flexible'] as const;
const noticePeriods = ['Immediate', '15 Days', '30 Days', '60 Days', '90+ Days'] as const;
const profileCategories = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'UI/UX Design',
  'Data & Analytics',
  'Marketing',
  'Business Operations',
  'Human Resources',
  'Finance',
  'Other',
] as const;
const profileCareerLevels = ['Fresher', 'Junior', 'Mid-Level', 'Senior', 'Lead'] as const;
const profileWorkPreferences = ['Remote', 'Hybrid', 'On-site', 'Flexible'] as const;
const profileMetaMarker = '[PROFILE_META]';

type ProfileMeta = {
  category: string;
  careerLevel: string;
  preferredWorkMode: string;
  bioText: string;
};

const parseProfileMeta = (bio: string | null | undefined): ProfileMeta => {
  const rawBio = bio || '';
  const [bioText, metaBlock = ''] = rawBio.split(profileMetaMarker);
  const metadata = Object.fromEntries(
    metaBlock
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [key, ...rest] = line.split(':');
        return [key.trim(), rest.join(':').trim()];
      })
  );

  return {
    category: metadata.Category || 'Frontend Development',
    careerLevel: metadata['Career Level'] || 'Fresher',
    preferredWorkMode: metadata['Preferred Work Mode'] || 'Remote',
    bioText: bioText.trim(),
  };
};

const getSavedJobsStorageKey = (userId: string) => `saved_jobs_${userId}`;

const buildProfileBio = (bioText: string, meta: Omit<ProfileMeta, 'bioText'>) =>
  [
    bioText.trim(),
    profileMetaMarker,
    `Category: ${meta.category}`,
    `Career Level: ${meta.careerLevel}`,
    `Preferred Work Mode: ${meta.preferredWorkMode}`,
  ]
    .filter(Boolean)
    .join('\n');

const inferApplicationCategory = (job: Job) => {
  const content = `${job.title} ${job.description || ''} ${job.requirements || ''}`.toLowerCase();

  if (/developer|engineer|frontend|backend|full stack|software|web/.test(content)) return 'Software Development';
  if (/designer|ui|ux|figma|graphic/.test(content)) return 'Design';
  if (/data|analyst|analytics|machine learning|ai/.test(content)) return 'Data & Analytics';
  if (/marketing|seo|content|brand/.test(content)) return 'Marketing';
  if (/sales|business development/.test(content)) return 'Sales';
  if (/hr|human resources|talent|recruit/.test(content)) return 'Human Resources';
  if (/operations|supply chain|logistics/.test(content)) return 'Operations';
  if (/support|customer service|success/.test(content)) return 'Customer Support';
  if (/finance|account|accounting|audit/.test(content)) return 'Finance';

  return 'Other';
};

type SkillInsight = {
  requiredSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchPercentage: number;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeSkill = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w#+.\s/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const dedupeSkills = (skills: string[]) => Array.from(new Set(skills));

const splitTextToPoints = (text: string | null | undefined) =>
  (text || '')
    .split(/\r?\n|•|-/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const extractSkillsFromText = (text: string) => {
  const normalizedText = normalizeSkill(text);

  return SKILL_KEYWORDS.filter(({ aliases }) =>
    aliases.some((alias) => new RegExp(`(^|\\b)${escapeRegExp(normalizeSkill(alias))}(\\b|$)`, 'i').test(normalizedText))
  ).map(({ label }) => label);
};

const buildSkillInsight = (job: Job, userSkills: string[]): SkillInsight => {
  const requiredSkills = dedupeSkills(
    extractSkillsFromText(`${job.title} ${job.description || ''} ${job.requirements || ''}`)
  );

  if (requiredSkills.length === 0) {
    return {
      requiredSkills: [],
      matchedSkills: [],
      missingSkills: [],
      matchPercentage: 0,
    };
  }

  const normalizedUserSkills = new Set(
    userSkills.flatMap((skill) => {
      const normalized = normalizeSkill(skill);
      const canonicalMatch = SKILL_KEYWORDS.find(({ label, aliases }) =>
        [label, ...aliases].some((item) => normalizeSkill(item) === normalized)
      );

      return canonicalMatch ? [canonicalMatch.label] : [skill.trim()];
    })
  );

  const matchedSkills = requiredSkills.filter((skill) => normalizedUserSkills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !normalizedUserSkills.has(skill));
  const matchPercentage = Math.round((matchedSkills.length / requiredSkills.length) * 100);

  return {
    requiredSkills,
    matchedSkills,
    missingSkills,
    matchPercentage,
  };
};

export function JobSeekerDashboard() {
  const { profile, signOut } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applicationJob, setApplicationJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<'all' | Job['job_type']>('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [applicationFilter, setApplicationFilter] = useState<'all' | 'applied' | 'not_applied'>('all');
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [jobSeekerProfile, setJobSeekerProfile] = useState<JobSeekerProfile | null>(null);
  const [applicationSuccessMessage, setApplicationSuccessMessage] = useState('');
  const [applicationErrorMessage, setApplicationErrorMessage] = useState('');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'applications' | 'saved'>('search');

  const [profileForm, setProfileForm] = useState({
    skills: '',
    experience: '',
    phone: '',
    location: '',
    bio: '',
    category: 'Frontend Development',
    careerLevel: 'Fresher',
    preferredWorkMode: 'Remote',
  });

  const [applicationForm, setApplicationForm] = useState({
    applicantName: '',
    applicantEmail: '',
    skills: [] as string[],
    resumeFileName: '',
    resumeDataUrl: '',
    category: 'Software Development',
    experienceLevel: 'Fresher',
    preferredWorkMode: 'Remote',
    noticePeriod: 'Immediate',
    referenceOption: 'available_on_request' as const,
    referenceDetails: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [resumePreview, setResumePreview] = useState('');

  useEffect(() => {
    if (!profile?.id) return;

    loadJobs();
    loadApplications();
    loadProfile();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) {
      setSavedJobIds([]);
      return;
    }

    const storedValue = window.localStorage.getItem(getSavedJobsStorageKey(profile.id));

    if (!storedValue) {
      setSavedJobIds([]);
      return;
    }

    try {
      const parsedIds = JSON.parse(storedValue);
      setSavedJobIds(Array.isArray(parsedIds) ? parsedIds : []);
    } catch {
      setSavedJobIds([]);
    }
  }, [profile?.id]);

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
      const parsedProfileMeta = parseProfileMeta(data.bio);
      setJobSeekerProfile(data);
      setProfileForm({
        skills: data.skills?.join(', ') || '',
        experience: data.experience || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: parsedProfileMeta.bioText || '',
        category: parsedProfileMeta.category,
        careerLevel: parsedProfileMeta.careerLevel,
        preferredWorkMode: parsedProfileMeta.preferredWorkMode,
      });
      setApplicationForm((current) => ({
        ...current,
        applicantName: profile?.full_name || current.applicantName,
        applicantEmail: profile?.email || current.applicantEmail,
        skills: data.skills || [],
        resumeDataUrl: data.resume_url || current.resumeDataUrl,
        resumeFileName: current.resumeFileName,
      }));
    } else {
      setJobSeekerProfile(null);
      setApplicationForm((current) => ({
        ...current,
        applicantName: profile?.full_name || current.applicantName,
        applicantEmail: profile?.email || current.applicantEmail,
      }));
    }
  };

  const isProfileComplete =
    !!jobSeekerProfile &&
    Boolean(
      jobSeekerProfile.skills?.length &&
      jobSeekerProfile.phone?.trim() &&
      jobSeekerProfile.location?.trim() &&
      parseProfileMeta(jobSeekerProfile.bio).bioText.trim()
    );

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
        bio: buildProfileBio(profileForm.bio, {
          category: profileForm.category,
          careerLevel: profileForm.careerLevel,
          preferredWorkMode: profileForm.preferredWorkMode,
        }),
        resume_url: resumePreview
          ? `data:text/plain;charset=utf-8,${encodeURIComponent(resumePreview)}`
          : jobSeekerProfile?.resume_url || '',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile?.id);

    if (!error) {
      setShowProfileEditor(false);
      loadProfile();
    }

    setLoading(false);
  };

  const handleApply = async (jobId: string) => {
    if (!isProfileComplete) {
      setApplicationSuccessMessage('');
      setApplicationErrorMessage('Complete your profile from the profile icon before applying for jobs.');
      setShowProfileEditor(true);
      return;
    }

    const job = jobs.find((item) => item.id === jobId) || selectedJob;
    if (!job) return;

    setApplicationSuccessMessage('');
    setApplicationErrorMessage('');
    setSelectedJob(null);
    setApplicationJob(job);
    setApplicationForm((current) => ({
      ...current,
      applicantName: profile?.full_name || '',
      applicantEmail: profile?.email || '',
      skills: profileForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      resumeDataUrl: jobSeekerProfile?.resume_url || current.resumeDataUrl,
      resumeFileName: current.resumeFileName,
      category: inferApplicationCategory(job),
      preferredWorkMode:
        job.location?.toLowerCase().includes('remote') ? 'Remote' : current.preferredWorkMode,
    }));
  };

  const addSkillChip = () => {
    const nextSkill = skillInput.trim();
    if (!nextSkill) return;

    setApplicationForm((current) => ({
      ...current,
      skills: current.skills.includes(nextSkill) ? current.skills : [...current.skills, nextSkill],
    }));
    setSkillInput('');
  };

  const removeSkillChip = (skillToRemove: string) => {
    setApplicationForm((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleResumeUpload = async (file: File | null) => {
    if (!file) return;

    const fileToDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
        reader.onerror = () => reject(new Error('Unable to read resume file'));
        reader.readAsDataURL(file);
      });

    const resumeDataUrl = await fileToDataUrl();

    setApplicationForm((current) => ({
      ...current,
      resumeFileName: file.name,
      resumeDataUrl,
    }));
  };

  const buildResumeText = () => {
    const skills = profileForm.skills
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

    return [
      profile?.full_name || 'Name',
      profile?.email || 'Email',
      `${profileForm.category} | ${profileForm.careerLevel} | ${profileForm.preferredWorkMode}`,
      `${profileForm.location}${profileForm.location && profileForm.phone ? ' | ' : ''}${profileForm.phone}`,
      '',
      'Professional Summary',
      profileForm.bio,
      '',
      'Experience',
      profileForm.experience,
      '',
      'Skills',
      skills.length ? skills.join(', ') : 'Not specified',
      '',
      'Generated from Job Portal profile',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const generateResume = () => {
    const resumeText = buildResumeText();
    setResumePreview(resumeText);
    setApplicationForm((current) => ({
      ...current,
      resumeFileName: 'generated-resume.txt',
      resumeDataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(resumeText)}`,
    }));
  };

  const downloadResume = () => {
    const resumeText = resumePreview || buildResumeText();
    const blob = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resume.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationJob || !profile?.id) return;

    setApplying(true);
    setApplicationSuccessMessage('');
    setApplicationErrorMessage('');
    const skillsArray = applicationForm.skills;
    const extraApplicationDetails = [
      `Application Category: ${applicationForm.category}`,
      `Experience Level: ${applicationForm.experienceLevel}`,
      `Preferred Work Mode: ${applicationForm.preferredWorkMode}`,
      `Notice Period: ${applicationForm.noticePeriod}`,
      applicationForm.referenceDetails.trim()
        ? `Additional Notes: ${applicationForm.referenceDetails.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const { error } = await supabase.from('applications').insert({
      job_id: applicationJob.id,
      job_seeker_id: profile.id,
      status: 'pending',
      applicant_name: applicationForm.applicantName,
      applicant_email: applicationForm.applicantEmail,
      applicant_skills: skillsArray,
      resume_file_name: applicationForm.resumeFileName,
      resume_data_url: applicationForm.resumeDataUrl,
      reference_option: applicationForm.referenceOption,
      reference_details: extraApplicationDetails,
    });

    if (!error) {
      const { error: profileUpdateError } = await supabase
        .from('job_seeker_profiles')
        .update({
          skills: skillsArray,
          resume_url: applicationForm.resumeDataUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.id);

      if (profileUpdateError) {
        setApplicationErrorMessage(profileUpdateError.message);
        setApplying(false);
        return;
      }

      setApplicationJob(null);
      setSelectedJob(null);
      setActiveTab('applications');
      setApplicationSuccessMessage(
        `Application submitted successfully for ${applicationJob.title}. The recruiter for ${applicationJob.company?.name || 'this company'} can now view your submitted details.`
      );
      loadApplications();
      loadProfile();
    } else {
      setApplicationErrorMessage(error.message);
    }

    setApplying(false);
  };

  const hasApplied = (jobId: string) => applications.some(app => app.job_id === jobId);
  const isJobSaved = (jobId: string) => savedJobIds.includes(jobId);
  const handleToggleSaveJob = (jobId: string) => {
    if (!profile?.id) return;

    setSavedJobIds((current) => {
      const nextSavedJobIds = current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [jobId, ...current];

      window.localStorage.setItem(
        getSavedJobsStorageKey(profile.id),
        JSON.stringify(nextSavedJobIds)
      );

      return nextSavedJobIds;
    });
  };
  const profileSkills = jobSeekerProfile?.skills || profileForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean);
  const getSkillInsight = (job: Job) => buildSkillInsight(job, profileSkills);
  const locations = Array.from(new Set(jobs.map((job) => job.location).filter(Boolean))).sort();
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJobType = jobTypeFilter === 'all' || job.job_type === jobTypeFilter;
    const matchesLocation = locationFilter === 'all' || job.location === locationFilter;
    const isApplied = hasApplied(job.id);
    const matchesApplication =
      applicationFilter === 'all' ||
      (applicationFilter === 'applied' && isApplied) ||
      (applicationFilter === 'not_applied' && !isApplied);

    return matchesSearch && matchesJobType && matchesLocation && matchesApplication;
  });
  const recommendedJobs = jobs
    .filter((job) => !hasApplied(job.id))
    .map((job) => {
      const skillInsight = getSkillInsight(job);
      const fallbackScore = skillInsight.requiredSkills.length === 0 ? 15 : 0;

      return {
        job,
        skillInsight,
        recommendationScore: skillInsight.matchPercentage + fallbackScore,
      };
    })
    .sort((left, right) => right.recommendationScore - left.recommendationScore)
    .slice(0, 3);
  const savedJobs = savedJobIds
    .map((jobId) => jobs.find((job) => job.id === jobId))
    .filter((job): job is Job => Boolean(job));

  const handleLogout = async () => {
    const shouldLogout = window.confirm('Are you sure you want to log out?');
    if (!shouldLogout) return;

    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-col gap-3 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex items-center">
              <Briefcase className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">JobPortal</h1>
            </div>
            <div className="flex items-center justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Bookmark className="w-4 h-4" />
              
              </button>

              <DashboardProfileButton
                profile={profile}
                accentColorClass="text-blue-600"
                extraProfile={jobSeekerProfile}
                onEdit={() => setShowProfileEditor(true)}
              />
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {applicationSuccessMessage && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {applicationSuccessMessage}
          </div>
        )}

        {applicationErrorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {applicationErrorMessage}
          </div>
        )}

        <div className="mb-8 flex flex-col gap-1 rounded-lg bg-white p-1 shadow-sm sm:flex-row">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 flex items-center justify-center rounded-md py-2 px-4 transition ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Search className="w-5 h-5 mr-2" />
            Search Jobs
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 flex items-center justify-center rounded-md py-2 px-4 transition ${
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
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by job title, company, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value as typeof jobTypeFilter)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All job types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
                <select
                  value={applicationFilter}
                  onChange={(e) => setApplicationFilter(e.target.value as typeof applicationFilter)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All jobs</option>
                  <option value="not_applied">Not applied</option>
                  <option value="applied">Applied</option>
                </select>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
                <span>{filteredJobs.length} jobs found</span>
                {!isProfileComplete && <span>Complete your profile from the profile icon to apply.</span>}
                {!!profileSkills.length && <span>Skill gap suggestions are based on your saved profile skills.</span>}
              </div>
            </div>

            <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-5 text-white shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                    Recommended For You
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">Best-fit jobs based on your profile</h2>
                  <p className="mt-2 max-w-2xl text-sm text-blue-100">
                    Recommendations use your saved skills and application activity to surface the strongest opportunities first.
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50">
                  {recommendedJobs.length} suggested role{recommendedJobs.length === 1 ? '' : 's'}
                </div>
              </div>

              {recommendedJobs.length > 0 ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {recommendedJobs.map(({ job, skillInsight, recommendationScore }) => (
                    <div key={job.id} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm ring-1 ring-white/15">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="mt-1 text-sm text-blue-100">{job.company?.name || 'Company not listed'}</p>
                        </div>
                        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                          {recommendationScore}% fit
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/15 px-3 py-1">{job.job_type}</span>
                        <span className="rounded-full bg-white/15 px-3 py-1">{job.location}</span>
                        {job.salary_range && (
                          <span className="rounded-full bg-white/15 px-3 py-1">{job.salary_range}</span>
                        )}
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm text-blue-50">
                        {job.description}
                      </p>

                      <div className="mt-4 text-sm text-blue-100">
                        {skillInsight.requiredSkills.length > 0 ? (
                          <span>
                            Matches {skillInsight.matchedSkills.length} of {skillInsight.requiredSkills.length} identified skills.
                          </span>
                        ) : (
                          <span>Recommended from your recent activity and active openings.</span>
                        )}
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="flex-1 rounded-xl bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleToggleSaveJob(job.id)}
                          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                            isJobSaved(job.id)
                              ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                              : 'bg-white/15 text-white hover:bg-white/25'
                          }`}
                        >
                          {isJobSaved(job.id) ? 'Saved' : 'Save'}
                        </button>
                        <button
                          onClick={() => handleApply(job.id)}
                          className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                        >
                          Quick Apply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl bg-white/10 px-4 py-4 text-sm text-blue-50 ring-1 ring-white/15">
                  No recommendations yet. Add more profile skills or explore jobs to improve matching.
                </div>
              )}
            </div>
            <div className="grid gap-4">
              {filteredJobs.map((job) => {
                const skillInsight = getSkillInsight(job);

                return (
                <div key={job.id} className="rounded-lg bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
                      {skillInsight.requiredSkills.length > 0 && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-blue-900">
                              Skill match: {skillInsight.matchPercentage}%
                            </span>
                            <span className="text-sm text-blue-700">
                              {skillInsight.matchedSkills.length}/{skillInsight.requiredSkills.length} identified skills matched
                            </span>
                          </div>
                          {!!skillInsight.matchedSkills.length && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Matched skills</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {skillInsight.matchedSkills.map((skill) => (
                                  <span key={skill} className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {!!skillInsight.missingSkills.length && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Skill gap suggestions</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {skillInsight.missingSkills.slice(0, 6).map((skill) => (
                                  <span key={skill} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                                    Learn {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row lg:min-w-[220px] lg:flex-col">
                      <button
                        onClick={() => handleToggleSaveJob(job.id)}
                        className={`w-full rounded-lg border px-6 py-2 font-medium transition ${
                          isJobSaved(job.id)
                            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {isJobSaved(job.id) ? 'Saved' : 'Save Job'}
                      </button>
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="w-full rounded-lg border border-blue-600 px-6 py-2 font-medium text-blue-600 transition hover:bg-blue-50"
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
              );
            })}
              {filteredJobs.length === 0 && (
                <p className="text-center text-gray-500 py-8">No jobs found for your search.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <SavedJobsPage
            savedJobs={savedJobs}
            hasApplied={hasApplied}
            handleToggleSaveJob={handleToggleSaveJob}
            handleApply={handleApply}
            setSelectedJob={setSelectedJob}
            onBack={() => setActiveTab('search')}
          />
        )}

        {activeTab === 'applications' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Applications</h2>
            <div className="grid gap-4">
              {applications.map((app) => (
                <div key={app.id} className="rounded-lg bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {app.job?.title}
                      </h3>
                      <p className="text-gray-600 mb-2">{app.job?.company?.name}</p>
                      <p className="text-sm text-gray-500">
                        Applied {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center sm:justify-end">
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
          {(() => {
            const skillInsight = getSkillInsight(selectedJob);
            const requirementPoints = splitTextToPoints(selectedJob.requirements);
            const descriptionPoints = splitTextToPoints(selectedJob.description).slice(0, 4);
            const postedDate = new Date(selectedJob.created_at).toLocaleDateString();
            const applicationState = hasApplied(selectedJob.id) ? 'Already applied' : 'Open for application';

            return (
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-gray-600 mt-1">{selectedJob.company?.name}</p>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close job details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm font-semibold">Posted on</span>
                  </div>
                  <p className="mt-2 text-sm text-blue-900">{postedDate}</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-semibold">Match score</span>
                  </div>
                  <p className="mt-2 text-sm text-emerald-900">
                    {skillInsight.requiredSkills.length > 0 ? `${skillInsight.matchPercentage}% based on detected skills` : 'Profile-based recommendation available'}
                  </p>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Application</span>
                  </div>
                  <p className="mt-2 text-sm text-amber-900">{applicationState}</p>
                </div>
              </div>

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

              {descriptionPoints.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Role Highlights</h3>
                  <div className="grid gap-2">
                    {descriptionPoints.map((point, index) => (
                      <div key={`${point}-${index}`} className="flex gap-3 text-sm text-gray-700">
                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h3>
                <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
                {requirementPoints.length > 0 ? (
                  <div className="space-y-2">
                    {requirementPoints.map((point, index) => (
                      <div key={`${point}-${index}`} className="flex gap-3 text-gray-700">
                        <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700">No specific requirements provided.</p>
                )}
              </div>

              {skillInsight.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Skills Identified</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillInsight.requiredSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skillInsight.requiredSkills.length > 0 && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <h3 className="text-lg font-semibold text-gray-900">Skill Gap Suggestions</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Your profile matches {skillInsight.matchPercentage}% of the identifiable skills in this job post.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-green-700">Matched skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {skillInsight.matchedSkills.length > 0 ? (
                          skillInsight.matchedSkills.map((skill) => (
                            <span key={skill} className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No direct matches found yet.</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Suggested next skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {skillInsight.missingSkills.length > 0 ? (
                          skillInsight.missingSkills.map((skill) => (
                            <span key={skill} className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">You already cover the identified core skills.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Details</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Company:</span> {selectedJob.company?.name || 'N/A'}</p>
                    <p><span className="font-medium">Industry:</span> {selectedJob.company?.industry || 'N/A'}</p>
                    <p><span className="font-medium">Location:</span> {selectedJob.company?.location || selectedJob.location}</p>
                    <p>
                      <span className="font-medium">Website:</span>{' '}
                      {selectedJob.company?.website ? (
                        <a
                          href={selectedJob.company.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          Visit site
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </p>
                    <p><span className="font-medium">About:</span> {selectedJob.company?.description || 'No company description provided.'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Building2 className="h-4 w-4" />
                    <h3 className="text-lg font-semibold">Before You Apply</h3>
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <p>Check that your profile skills reflect this role's main requirements.</p>
                    <p>Keep your resume updated so recruiters see your latest experience.</p>
                    <p>
                      {hasApplied(selectedJob.id)
                        ? 'You have already applied for this job, so you can track the result in My Applications.'
                        : 'If this role fits your goals, you can apply directly from this popup.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="w-full rounded-lg border border-gray-300 px-5 py-2 text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleToggleSaveJob(selectedJob.id)}
                  className={`w-full rounded-lg px-5 py-2 font-medium transition sm:w-auto ${
                    isJobSaved(selectedJob.id)
                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {isJobSaved(selectedJob.id) ? 'Saved Job' : 'Save Job'}
                </button>
                <button
                  onClick={() => {
                    handleApply(selectedJob.id);
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
            );
          })()}
        </div>
      )}

      {showProfileEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isProfileComplete ? 'Edit Profile' : 'Complete Your Profile'}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Save your details once, then recruiters can review them when you apply.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileEditor(false)}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close profile editor"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={profileForm.category}
                    onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {profileCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Career Level
                  </label>
                  <select
                    value={profileForm.careerLevel}
                    onChange={(e) => setProfileForm({ ...profileForm, careerLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {profileCareerLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Work Mode
                  </label>
                  <select
                    value={profileForm.preferredWorkMode}
                    onChange={(e) => setProfileForm({ ...profileForm, preferredWorkMode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {profileWorkPreferences.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <span className="font-semibold">Profile summary:</span>{' '}
                {profileForm.category}, {profileForm.careerLevel}, prefers {profileForm.preferredWorkMode}.
              </div>

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
                  required
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    required
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
                  required
                />
              </div>

              <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Resume Maker</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Generate a simple resume from your profile details and download it instantly.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={generateResume}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Generate Resume
                    </button>
                    <button
                      type="button"
                      onClick={downloadResume}
                      disabled={!resumePreview}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Download
                    </button>
                  </div>
                </div>
                {resumePreview ? (
                  <textarea
                    readOnly
                    value={resumePreview}
                    rows={10}
                    className="mt-4 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700"
                  />
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    Click "Generate Resume" to preview a generated resume from your profile.
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
                {isProfileComplete && (
                  <button
                    type="button"
                    onClick={() => setShowProfileEditor(false)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {applicationJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-100">
          <div className="mx-auto min-h-screen max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setApplicationJob(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <span className="rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
                Applying for {applicationJob.title}
              </span>
            </div>

            <div className="rounded-2xl bg-white shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900">Application Form</h2>
                <p className="mt-2 text-gray-600">
                  Share your latest profile details so recruiters can review your application.
                </p>
              </div>

              <form onSubmit={handleSubmitApplication} className="space-y-6 p-6">
                {applicationErrorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                    {applicationErrorMessage}
                  </div>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={applicationForm.applicantName}
                      onChange={(e) => setApplicationForm({ ...applicationForm, applicantName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email ID</label>
                    <input
                      type="email"
                      value={applicationForm.applicantEmail}
                      onChange={(e) => setApplicationForm({ ...applicationForm, applicantEmail: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Application Category</label>
                    <select
                      value={applicationForm.category}
                      onChange={(e) => setApplicationForm({ ...applicationForm, category: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {applicationCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Experience Level</label>
                    <select
                      value={applicationForm.experienceLevel}
                      onChange={(e) => setApplicationForm({ ...applicationForm, experienceLevel: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {experienceLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Skills</label>
                  <div className="rounded-lg border border-gray-300 px-3 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {applicationForm.skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillChip(skill)}
                            className="text-blue-700 hover:text-blue-900"
                            aria-label={`Remove ${skill}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addSkillChip();
                          }
                        }}
                        placeholder="Enter Your Skills"
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 outline-none"
                      />
                      <button
                        type="button"
                        onClick={addSkillChip}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Example Skills : JavaScript , React , Python , SQL
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Preferred Work Mode</label>
                    <select
                      value={applicationForm.preferredWorkMode}
                      onChange={(e) => setApplicationForm({ ...applicationForm, preferredWorkMode: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {workModes.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Notice Period</label>
                    <select
                      value={applicationForm.noticePeriod}
                      onChange={(e) => setApplicationForm({ ...applicationForm, noticePeriod: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {noticePeriods.map((period) => (
                        <option key={period} value={period}>
                          {period}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <span className="font-semibold">Application summary:</span>{' '}
                  {applicationForm.category}, {applicationForm.experienceLevel}, {applicationForm.preferredWorkMode}, notice period {applicationForm.noticePeriod}.
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Resume Upload</label>
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-6 text-blue-700 transition hover:bg-blue-100">
                    <Upload className="h-5 w-5" />
                    <span>{applicationForm.resumeFileName || 'Choose resume file'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleResumeUpload(file);
                      }}
                    />
                  </label>
                  {applicationForm.resumeDataUrl && (
                    <p className="mt-2 text-sm text-gray-500">
                      Resume ready{applicationForm.resumeFileName ? `: ${applicationForm.resumeFileName}` : '.'}
                    </p>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Reference Option</label>
                    <select
                      value={applicationForm.referenceOption}
                      onChange={(e) =>
                        setApplicationForm({
                          ...applicationForm,
                          referenceOption: e.target.value as typeof applicationForm.referenceOption,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="available_on_request">Available on request</option>
                      <option value="attached_in_resume">Attached in resume</option>
                      <option value="contact_details_provided">Provide contact details below</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Additional Notes</label>
                    <textarea
                      value={applicationForm.referenceDetails}
                      onChange={(e) => setApplicationForm({ ...applicationForm, referenceDetails: e.target.value })}
                      rows={4}
                      placeholder="Add reference names, relationship, contact details, or any extra notes"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setApplicationJob(null)}
                    className="w-full rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying || !applicationForm.resumeDataUrl}
                    className="w-full rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
