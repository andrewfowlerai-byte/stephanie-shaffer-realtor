export type Stage = 'Prospect' | 'Contacted' | 'In Conversation' | 'Proposal Out' | 'Client';
export type Tier = 1 | 2 | 3;
export type Platform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'X' | 'TikTok' | 'YouTube' | 'Pinterest' | 'Other';
export type Service = 'Social Media Management' | 'Website Design' | 'AI Integration' | 'Analytics' | 'Blog Writing';

export interface Contact {
  id: string;
  created_at: string;
  business_name?: string;
  contact_name: string;
  email?: string;
  phone?: string;
  industry?: string;
  stage: Stage;
  tier?: Tier;
  platforms?: Platform[];
  services?: Service[];
  monthly_value?: number;
  one_time_value?: number;
  blog_addons?: number;
  notes?: string;
  next_followup?: string;
  source?: string;
  onboarded?: boolean;
  pages_converted?: boolean;
  location?: string;
  local_spots?: string[];
}
