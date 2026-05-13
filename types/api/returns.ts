import { ReturnStatus, Return, ReturnBox, ReturnBoxItem } from '../returns';

export interface CreateReturnDTO {
  responsible_user_id?: string;
  responsible_name?: string;
  origin_sector?: string;
  notes?: string;
  created_by?: string;
}

export interface UpdateReturnDTO {
  responsible_user_id?: string;
  responsible_name?: string;
  origin_sector?: string;
  notes?: string;
  status?: ReturnStatus;
  checked_by?: string;
  checked_at?: string;
  finalized_by?: string;
  finalized_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancel_reason?: string;
}

export interface ReturnResponse extends Return {
  return_boxes?: Array<ReturnBox & {
    return_box_items?: ReturnBoxItem[];
  }>;
}
