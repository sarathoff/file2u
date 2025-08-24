CREATE TABLE shared_files (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  share_code INT UNIQUE NOT NULL,
  file_url TEXT NOT NULL
);

-- Create a bucket for shared files
INSERT INTO storage.buckets (id, name, public) VALUES ('shared_files', 'shared_files', true);

-- Set up Row Level Security (RLS)
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON shared_files
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for anyone" ON shared_files
  FOR INSERT WITH CHECK (true);
