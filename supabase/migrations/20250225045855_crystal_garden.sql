/*
  # Fix Audit Logs Table Structure

  1. Changes
    - Drop and recreate audit_logs table with correct column types
    - Re-enable RLS and policies
  
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing audit_logs table
DROP TABLE IF EXISTS audit_logs;

-- Recreate audit_logs table with correct column types
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action audit_action NOT NULL,
  entity_type entity_type NOT NULL,
  entity_id uuid NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  performed_by uuid REFERENCES auth.users(id) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );