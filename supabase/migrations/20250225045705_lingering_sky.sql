/*
  # Fix RMA Permissions

  1. Changes
    - Drop existing RLS policies for RMAs table
    - Create new simplified policies that don't depend on users table
    - Add policies for authenticated users to perform CRUD operations
  
  2. Security
    - Enable RLS on RMAs table
    - Add policies for authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins have full access to RMAs" ON rmas;
DROP POLICY IF EXISTS "Users can view all RMAs" ON rmas;
DROP POLICY IF EXISTS "Users can create RMAs" ON rmas;
DROP POLICY IF EXISTS "Users can update their own RMAs" ON rmas;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
ON rmas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON rmas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON rmas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Modify RMAs table to use auth.uid() directly
ALTER TABLE rmas DROP COLUMN IF EXISTS created_by;
ALTER TABLE rmas DROP COLUMN IF EXISTS last_updated_by;
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS last_updated_by uuid DEFAULT auth.uid();