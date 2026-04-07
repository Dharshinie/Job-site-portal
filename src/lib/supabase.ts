import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'job_seeker' | 'recruiter' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface JobSeekerProfile {
  id: string;
  user_id: string;
  skills: string[];
  experience: string;
  resume_url: string;
  phone: string;
  location: string;
  bio: string;
}

export interface ApplicationProfileDetails {
  applicant_name: string;
  applicant_email: string;
  applicant_skills: string[];
  resume_file_name: string;
  resume_data_url: string;
  reference_option: 'available_on_request' | 'attached_in_resume' | 'contact_details_provided';
  reference_details: string;
}

export interface Company {
  id: string;
  recruiter_id: string;
  name: string;
  description: string;
  industry: string;
  location: string;
  website: string;
  logo_url: string;
}

export interface Job {
  id: string;
  company_id: string;
  recruiter_id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary_range: string;
  status: 'active' | 'closed';
  created_at: string;
  company?: Company;
}

export interface Application {
  id: string;
  job_id: string;
  job_seeker_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  cover_letter: string;
  applied_at: string;
  applicant_name: string;
  applicant_email: string;
  applicant_skills: string[];
  resume_file_name: string;
  resume_data_url: string;
  reference_option: 'available_on_request' | 'attached_in_resume' | 'contact_details_provided';
  reference_details: string;
  job?: Job;
  job_seeker?: UserProfile & { job_seeker_profile?: JobSeekerProfile };
}
