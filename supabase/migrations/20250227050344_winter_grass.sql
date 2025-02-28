/*
  # Fix Audit Logs RLS Policy

  1. Changes
    - Drop existing RLS policy for audit_logs
    - Create a new policy that allows all authenticated users to insert into audit_logs
    - Maintain admin-only select access
*/

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;

-- Create policy for admins to view audit logs
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

-- Create policy to allow all authenticated users to insert into audit logs
CREATE POLICY "All users can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);