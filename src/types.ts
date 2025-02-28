export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RMA {
  id: string;
  rma_number: string;
  serial_number: string;
  product_name: string;
  issue_description: string;
  status: 'in-progress' | 'completed';
  date_created: string;
  customer_name: string;
  customer_email: string;
  erp_code: string;
  bound_machine: boolean;
  bound_machine_erp?: string;
  bound_machine_serial?: string;
  repair_info?: {
    technician: string;
    sentDate: string;
    estimatedCost: number;
    externalRmaNumber: string;
  };
  notes: string[];
  attachments: Attachment[];
}

export interface RMAComment {
  id: string;
  rma_id: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'manual' | 'guide' | 'image' | 'document';
  uploaded_at: string;
  uploaded_by: string;
}

export interface Manual {
  id: string;
  name: string;
  title: string;
  file_path: string;
  folder_path: string;
  file_type: string;
  description: string;
  uploaded_by: string;
  uploaded_at: string;
  last_modified: string;
  size: number;
}