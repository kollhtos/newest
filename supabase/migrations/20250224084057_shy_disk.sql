/*
  # Add Manuals Management

  1. New Tables
    - `manuals`
      - `id` (uuid, primary key)
      - `name` (text)
      - `file_path` (text)
      - `file_type` (text)
      - `description` (text)
      - `uploaded_by` (uuid, references auth.users)
      - `uploaded_at` (timestamptz)
      - `last_modified` (timestamptz)
      - `size` (integer)

  2. Security
    - Enable RLS on manuals table
    - Add policies for authenticated users
*/

-- Create manuals table
CREATE TABLE IF NOT EXISTS manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  description text,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  last_modified timestamptz NOT NULL DEFAULT now(),
  size integer NOT NULL,
  CONSTRAINT valid_size CHECK (size > 0)
);

-- Enable RLS
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view manuals"
  ON manuals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload manuals"
  ON manuals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Admins can update manuals"
  ON manuals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete manuals"
  ON manuals
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Function to update last_modified timestamp
CREATE OR REPLACE FUNCTION update_manual_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for last_modified
CREATE TRIGGER update_manual_modified_trigger
  BEFORE UPDATE ON manuals
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_modified();