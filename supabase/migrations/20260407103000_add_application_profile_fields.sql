ALTER TABLE applications
ADD COLUMN IF NOT EXISTS applicant_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS applicant_email text DEFAULT '',
ADD COLUMN IF NOT EXISTS applicant_skills text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS resume_file_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS resume_data_url text DEFAULT '',
ADD COLUMN IF NOT EXISTS reference_option text DEFAULT 'available_on_request'
  CHECK (reference_option IN ('available_on_request', 'attached_in_resume', 'contact_details_provided')),
ADD COLUMN IF NOT EXISTS reference_details text DEFAULT '';
