export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Need More Information"
  | "Approved"
  | "Rejected";

export type ApplicationType =
  | "Recordation"
  | "Renewal"
  | "Change of Ownership"
  | "Change of Name"
  | "Discontinuation";

export interface Application {
  id: number;
  tracking_number: string;
  applicant_name: string;
  applicant_email: string;
  company_name: string;
  application_type: ApplicationType;
  description: string;
  status: ApplicationStatus;
  reviewer_comment: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface ApplicationListItem {
  id: number;
  tracking_number: string;
  applicant_name: string;
  company_name: string;
  application_type: ApplicationType;
  status: ApplicationStatus;
  created_at: string;
}

export interface CreateApplicationPayload {
  applicant_name: string;
  applicant_email: string;
  company_name: string;
  application_type: ApplicationType;
  description?: string;
}

export interface UpdateApplicationPayload {
  applicant_name?: string;
  applicant_email?: string;
  company_name?: string;
  application_type?: ApplicationType;
  description?: string;
}

export interface DecisionPayload {
  decision: "Approved" | "Need More Information" | "Rejected";
  reviewer_comment?: string;
}

export const APPLICATION_TYPES: ApplicationType[] = [
  "Recordation",
  "Renewal",
  "Change of Ownership",
  "Change of Name",
  "Discontinuation",
];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Need More Information",
  "Approved",
  "Rejected",
];
