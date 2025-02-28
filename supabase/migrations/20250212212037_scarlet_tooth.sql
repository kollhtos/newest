/*
  # Initial Schema Setup for RMA Management System

  1. Tables
    - users (handled by Supabase Auth)
    - rmas
    - attachments
    - audit_logs
  
  2. Security
    - RLS policies for each table
    - Admin role has full access
    - Users have limited access based on their role
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE rma_status AS ENUM ('pending', 'in-progress', 'completed', 'cancelled');
CREATE TYPE attachment_type AS ENUM ('manual', 'guide', 'image', 'document');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'status_change', 'login', 'logout');
CREATE TYPE entity_type AS ENUM ('rma', 'user', 'attachment');

-- Create RMAs table
CREATE TABLE IF NOT EXISTS rmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number TEXT UNIQUE NOT NULL,
  serial_number TEXT NOT NULL,
  product_name TEXT NOT NULL,
  issue_description TEXT NOT NULL,
  status rma_status NOT NULL DEFAULT 'pending',
  date_created TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  assigned_technician_id uuid REFERENCES auth.users(id),
  notes TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_id uuid REFERENCES rmas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type attachment_type NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action audit_action NOT NULL,
  entity_type entity_type NOT NULL,
  entity_id uuid NOT NULL,
  changes JSONB NOT NULL DEFAULT '{}'::jsonb,
  performed_by uuid REFERENCES auth.users(id) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE rmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for RMAs
CREATE POLICY "Admins have full access to RMAs"
  ON rmas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can view all RMAs"
  ON rmas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create RMAs"
  ON rmas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own RMAs"
  ON rmas
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- RLS Policies for Attachments
CREATE POLICY "Admins have full access to attachments"
  ON attachments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Users can view all attachments"
  ON attachments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can upload attachments"
  ON attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

-- RLS Policies for Audit Logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION generate_rma_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rma_number := 'RMA-' || to_char(NOW(), 'YYYY') || '-' || 
                    LPAD(CAST((
                      SELECT COUNT(*) + 1 
                      FROM rmas 
                      WHERE date_created >= date_trunc('year', NOW())
                    ) AS TEXT), 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for RMA number generation
CREATE TRIGGER generate_rma_number_trigger
  BEFORE INSERT ON rmas
  FOR EACH ROW
  EXECUTE FUNCTION generate_rma_number();

-- Function to log changes
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    changes,
    performed_by
  ) VALUES (
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'::audit_action
      WHEN TG_OP = 'UPDATE' THEN 
        CASE
          WHEN OLD.status != NEW.status THEN 'status_change'::audit_action
          ELSE 'update'::audit_action
        END
      WHEN TG_OP = 'DELETE' THEN 'delete'::audit_action
    END,
    TG_TABLE_NAME::entity_type,
    CASE
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', row_to_json(NEW))
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW))
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', row_to_json(OLD))
    END,
    auth.uid()
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for audit logging
CREATE TRIGGER rmas_audit
  AFTER INSERT OR UPDATE OR DELETE ON rmas
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();

CREATE TRIGGER attachments_audit
  AFTER INSERT OR UPDATE OR DELETE ON attachments
  FOR EACH ROW
  EXECUTE FUNCTION log_changes();