/*
  # Fix Audit Logging

  1. Changes
    - Update entity_type enum to match table names
    - Modify log_changes function to handle table names correctly
  
  2. Security
    - No security changes
*/

-- Drop and recreate the entity_type enum with correct values
DROP TYPE IF EXISTS entity_type CASCADE;
CREATE TYPE entity_type AS ENUM ('rma', 'user', 'attachment', 'manual');

-- Update the log_changes function to handle table names correctly
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
    CASE TG_TABLE_NAME
      WHEN 'rmas' THEN 'rma'::entity_type
      WHEN 'attachments' THEN 'attachment'::entity_type
      WHEN 'user_profiles' THEN 'user'::entity_type
      WHEN 'manuals' THEN 'manual'::entity_type
    END,
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