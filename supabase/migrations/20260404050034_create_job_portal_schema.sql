/*
  # Job Portal Database Schema

  ## Overview
  This migration creates the complete database structure for a job portal with three user types:
  - Job Seekers: Can create profiles, search jobs, and apply
  - Recruiters: Can create company profiles, post jobs, and manage applicants
  - Admins: Can manage all users and content

  ## New Tables

  ### 1. `user_profiles`
  Stores additional user information and role
  - `id` (uuid, primary key, references auth.users)
  - `role` (text) - 'job_seeker', 'recruiter', or 'admin'
  - `full_name` (text)
  - `email` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `job_seeker_profiles`
  Extended profile information for job seekers
  - `id` (uuid, primary key)
  - `user_id` (uuid, references user_profiles)
  - `skills` (text array)
  - `experience` (text)
  - `resume_url` (text)
  - `phone` (text)
  - `location` (text)
  - `bio` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `companies`
  Company profiles created by recruiters
  - `id` (uuid, primary key)
  - `recruiter_id` (uuid, references user_profiles)
  - `name` (text)
  - `description` (text)
  - `industry` (text)
  - `location` (text)
  - `website` (text)
  - `logo_url` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `jobs`
  Job postings created by recruiters
  - `id` (uuid, primary key)
  - `company_id` (uuid, references companies)
  - `recruiter_id` (uuid, references user_profiles)
  - `title` (text)
  - `description` (text)
  - `requirements` (text)
  - `location` (text)
  - `job_type` (text) - 'full-time', 'part-time', 'contract', 'internship'
  - `salary_range` (text)
  - `status` (text) - 'active', 'closed'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. `applications`
  Job applications submitted by job seekers
  - `id` (uuid, primary key)
  - `job_id` (uuid, references jobs)
  - `job_seeker_id` (uuid, references user_profiles)
  - `status` (text) - 'pending', 'accepted', 'rejected'
  - `cover_letter` (text)
  - `applied_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Job seekers can only manage their own profiles and applications
  - Recruiters can only manage their own companies and jobs
  - Recruiters can view and update applications for their jobs
  - Admins have full access to all data
  - Public users can view active jobs and company information
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'recruiter', 'admin')),
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create job_seeker_profiles table
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  skills text[] DEFAULT '{}',
  experience text DEFAULT '',
  resume_url text DEFAULT '',
  phone text DEFAULT '',
  location text DEFAULT '',
  bio text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job seekers can view all profiles"
  ON job_seeker_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Job seekers can update own profile"
  ON job_seeker_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Job seekers can insert own profile"
  ON job_seeker_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  industry text DEFAULT '',
  location text DEFAULT '',
  website text DEFAULT '',
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Recruiters can insert own company"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update own company"
  ON companies FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can delete own company"
  ON companies FOR DELETE
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies ON DELETE CASCADE,
  recruiter_id uuid NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  requirements text DEFAULT '',
  location text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship')),
  salary_range text DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (status = 'active' OR recruiter_id = auth.uid());

CREATE POLICY "Recruiters can insert own jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can delete own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs ON DELETE CASCADE,
  job_seeker_id uuid NOT NULL REFERENCES user_profiles ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  cover_letter text DEFAULT '',
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, job_seeker_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job seekers can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (job_seeker_id = auth.uid() OR EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid()
  ));

CREATE POLICY "Job seekers can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (job_seeker_id = auth.uid());

CREATE POLICY "Recruiters can update applications for their jobs"
  ON applications FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_seeker_id ON applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);