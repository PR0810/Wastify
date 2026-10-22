import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
  },
});

export type Profile = {
  id: string;
  role: 'driver' | 'admin' | 'ngo' | 'citizen';
  full_name: string;
  phone: string;
  address: string;
  points: number;
  avatar_url: string;
  age: number | null;
  created_at: string;
  updated_at: string;
};

export type WasteReport = {
  id: string;
  reporter_id: string;
  type: 'road_waste' | 'overflowing_bin' | 'illegal_dumping' | 'other';
  description: string;
  photo_url: string;
  latitude: number | null;
  longitude: number | null;
  address: string;
  status: 'pending' | 'in_progress' | 'resolved';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type RecyclableListing = {
  id: string;
  citizen_id: string;
  waste_type: 'plastic' | 'paper' | 'cardboard' | 'cloth' | 'metal' | 'e_waste' | 'organic' | 'other';
  quantity_kg: number;
  description: string;
  photo_url: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  status: 'available' | 'accepted' | 'collected';
  accepted_by: string | null;
  created_at: string;
};

export type SurplusFood = {
  id: string;
  citizen_id: string;
  food_type: string;
  quantity: string;
  preparation_time: string | null;
  description: string;
  photo_url: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_fresh: boolean;
  status: 'available' | 'accepted' | 'collected' | 'rejected';
  accepted_by: string | null;
  created_at: string;
};

export type Area = {
  id: string;
  name: string;
  city: string;
  boundary_geojson: unknown;
  created_at: string;
};

export type DriverAssignment = {
  id: string;
  driver_id: string;
  area_id: string;
  assigned_by: string;
  house_no: string;
  full_address: string;
  city: string;
  status: 'active' | 'inactive';
  created_at: string;
};

export type VehicleLocation = {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  updated_at: string;
};

export type CollectionTrip = {
  id: string;
  driver_id: string;
  area_id: string | null;
  status: 'in_progress' | 'completed' | 'cancelled';
  waste_collected_kg: number;
  dropoff_location: string;
  notes: string;
  started_at: string;
  completed_at: string | null;
};

export type LearningModule = {
  id: string;
  title: string;
  description: string;
  age_group: 'kids' | 'teens';
  level: 'beginner' | 'intermediate' | 'advanced';
  content: {
    type: string;
    slides?: { title: string; body: string; game?: string }[];
    sections?: { heading: string; body: string; game?: string }[];
  };
  video_url: string;
  order_index: number;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  module_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export type QuizAttempt = {
  id: string;
  user_id: string;
  module_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  answers: number[];
  created_at: string;
};

export type Certificate = {
  id: string;
  user_id: string;
  certificate_type: string;
  module_id: string | null;
  issued_at: string;
  certificate_number: string;
};

export type Reward = {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  awarded_by: string | null;
  created_at: string;
};
