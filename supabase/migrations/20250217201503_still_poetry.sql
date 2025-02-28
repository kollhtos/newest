/*
  # Add missing columns to RMAs table

  1. Changes
    - Add `bound_machine` boolean column
    - Add `bound_machine_erp` text column
    - Add `bound_machine_serial` text column
    - Add `erp_code` text column
    - Add `product_name` text column
    - Add `customer_name` text column
    - Add `customer_email` text column
    - Add `repair_info` jsonb column for storing repair details
    - Update RLS policies to reflect new columns

  2. Security
    - Maintain existing RLS policies
    - Add validation for new columns
*/

-- Add missing columns to RMAs table
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS bound_machine boolean DEFAULT false;
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS bound_machine_erp text;
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS bound_machine_serial text;
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS erp_code text NOT NULL;
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS product_name text NOT NULL;
ALTER TABLE rmas ADD COLUMN IF NOT EXISTS repair_info jsonb DEFAULT NULL;

-- Add validation check for repair_info structure
ALTER TABLE rmas ADD CONSTRAINT repair_info_check 
  CHECK (
    repair_info IS NULL OR (
      repair_info ? 'technician' AND
      repair_info ? 'sentDate' AND
      repair_info ? 'estimatedCost' AND
      repair_info ? 'externalRmaNumber'
    )
  );

-- Add check constraint for bound machine data
ALTER TABLE rmas ADD CONSTRAINT bound_machine_data_check
  CHECK (
    (bound_machine = false) OR
    (bound_machine = true AND bound_machine_erp IS NOT NULL AND bound_machine_serial IS NOT NULL)
  );