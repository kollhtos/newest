/*
  # Update RMA System

  1. Changes
    - Add folder support for manuals
    - Add title field for manuals
    - Update RMA numbering format
    - Add status tracking
    - Add notes and comments support
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add folders support for manuals
ALTER TABLE manuals 
ADD COLUMN IF NOT EXISTS folder_path text DEFAULT '',
ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';

-- Update RMA numbering sequence
CREATE SEQUENCE IF NOT EXISTS rma_number_seq;

-- Function to generate AMCO-style RMA numbers
CREATE OR REPLACE FUNCTION generate_amco_rma_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rma_number := 'AMCO' || LPAD(nextval('rma_number_seq')::text, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS generate_rma_number_trigger ON rmas;

-- Create new trigger for AMCO-style numbering
CREATE TRIGGER generate_amco_rma_number_trigger
  BEFORE INSERT ON rmas
  FOR EACH ROW
  EXECUTE FUNCTION generate_amco_rma_number();

-- Add comments table for RMAs
CREATE TABLE IF NOT EXISTS rma_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_id uuid REFERENCES rmas(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for comments
ALTER TABLE rma_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Users can view all comments"
  ON rma_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON rma_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add RLS policy for folders
CREATE POLICY "Users can create folders"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'service-manuals');

-- Update audit log trigger for comments
CREATE TRIGGER rma_comments_audit
  AFTER INSERT OR UPDATE OR DELETE ON rma_comments
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();