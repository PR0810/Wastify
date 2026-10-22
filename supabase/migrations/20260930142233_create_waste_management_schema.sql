/*
# Waste Management Platform - Core Schema

## Overview
Multi-role waste management platform with 4 user types: Driver, Administrator, NGO/Recycler Partner, and Citizen/Student.
Includes GPS vehicle tracking, waste reporting, recyclable listings, surplus food rescue, rewards, student learning, and certificates.

## Tables Created
1. **profiles** - Extends auth.users with role, name, phone, address, points
2. **areas** - Geographic areas for driver assignment
3. **driver_assignments** - Links drivers to areas (admin assigns)
4. **vehicle_locations** - GPS tracking for collection vehicles
5. **waste_reports** - Citizen reports of road waste, overflowing bins (photo + location + status)
6. **report_assignments** - Admin assigns reports to drivers/teams
7. **recyclable_listings** - Citizen lists recyclable waste (plastic, paper, etc.)
8. **surplus_food** - Citizen lists surplus food for rescue NGOs
9. **rewards** - Reward transactions for drivers and citizens
10. **learning_modules** - Learning content for students (age-based)
11. **quiz_questions** - Quiz questions tied to modules
12. **quiz_attempts** - Student quiz/test attempts
13. **certificates** - Completion certificates for students

## Security
- RLS enabled on all tables
- Owner-scoped policies using auth.uid() for citizen data
- Role-based access via profiles.role column
- All policies use authenticated role (sign-in required)
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('driver', 'admin', 'ngo', 'citizen')),
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  address text DEFAULT '',
  points integer NOT NULL DEFAULT 0,
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ AREAS ============
CREATE TABLE IF NOT EXISTS areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  boundary_geojson jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_areas" ON areas;
CREATE POLICY "read_areas" ON areas FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_areas" ON areas;
CREATE POLICY "admin_manage_areas" ON areas FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_areas" ON areas;
CREATE POLICY "admin_update_areas" ON areas FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_areas" ON areas;
CREATE POLICY "admin_delete_areas" ON areas FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ DRIVER ASSIGNMENTS ============
CREATE TABLE IF NOT EXISTS driver_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area_id uuid NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_driver_assignments" ON driver_assignments;
CREATE POLICY "read_driver_assignments" ON driver_assignments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_driver_assignments" ON driver_assignments;
CREATE POLICY "admin_insert_driver_assignments" ON driver_assignments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_driver_assignments" ON driver_assignments;
CREATE POLICY "admin_update_driver_assignments" ON driver_assignments FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_driver_assignments" ON driver_assignments;
CREATE POLICY "admin_delete_driver_assignments" ON driver_assignments FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ VEHICLE LOCATIONS ============
CREATE TABLE IF NOT EXISTS vehicle_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed double precision DEFAULT 0,
  heading double precision DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_vehicle_locations" ON vehicle_locations;
CREATE POLICY "read_vehicle_locations" ON vehicle_locations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "driver_insert_own_location" ON vehicle_locations;
CREATE POLICY "driver_insert_own_location" ON vehicle_locations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "driver_update_own_location" ON vehicle_locations;
CREATE POLICY "driver_update_own_location" ON vehicle_locations FOR UPDATE
  TO authenticated USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

-- ============ WASTE REPORTS ============
CREATE TABLE IF NOT EXISTS waste_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'road_waste' CHECK (type IN ('road_waste', 'overflowing_bin', 'illegal_dumping', 'other')),
  description text DEFAULT '',
  photo_url text DEFAULT '',
  latitude double precision,
  longitude double precision,
  address text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved')),
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_waste_reports" ON waste_reports;
CREATE POLICY "read_waste_reports" ON waste_reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_waste_report" ON waste_reports;
CREATE POLICY "insert_own_waste_report" ON waste_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "update_own_waste_report" ON waste_reports;
CREATE POLICY "update_own_waste_report" ON waste_reports FOR UPDATE
  TO authenticated USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);

-- Admin can update any report (assign, change status)
DROP POLICY IF EXISTS "admin_update_waste_reports" ON waste_reports;
CREATE POLICY "admin_update_waste_reports" ON waste_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  ) WITH CHECK (true);

-- Driver can update reports assigned to them (mark resolved)
DROP POLICY IF EXISTS "driver_update_waste_reports" ON waste_reports;
CREATE POLICY "driver_update_waste_reports" ON waste_reports FOR UPDATE
  TO authenticated USING (
    assigned_to = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'driver')
  ) WITH CHECK (true);

-- ============ RECYCLABLE LISTINGS ============
CREATE TABLE IF NOT EXISTS recyclable_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  waste_type text NOT NULL CHECK (waste_type IN ('plastic', 'paper', 'cardboard', 'cloth', 'metal', 'e_waste', 'organic', 'other')),
  quantity_kg double precision DEFAULT 0,
  description text DEFAULT '',
  photo_url text DEFAULT '',
  address text DEFAULT '',
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'accepted', 'collected')),
  accepted_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recyclable_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_recyclable_listings" ON recyclable_listings;
CREATE POLICY "read_recyclable_listings" ON recyclable_listings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_recyclable" ON recyclable_listings;
CREATE POLICY "insert_own_recyclable" ON recyclable_listings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "update_own_recyclable" ON recyclable_listings;
CREATE POLICY "update_own_recyclable" ON recyclable_listings FOR UPDATE
  TO authenticated USING (auth.uid() = citizen_id) WITH CHECK (auth.uid() = citizen_id);

-- NGO can update (accept/collect) any recyclable listing
DROP POLICY IF EXISTS "ngo_update_recyclable" ON recyclable_listings;
CREATE POLICY "ngo_update_recyclable" ON recyclable_listings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ngo')
  ) WITH CHECK (true);

-- ============ SURPLUS FOOD ============
CREATE TABLE IF NOT EXISTS surplus_food (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  food_type text NOT NULL DEFAULT '',
  quantity text DEFAULT '',
  preparation_time timestamptz,
  description text DEFAULT '',
  photo_url text DEFAULT '',
  address text DEFAULT '',
  latitude double precision,
  longitude double precision,
  is_fresh boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'accepted', 'collected', 'rejected')),
  accepted_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE surplus_food ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_surplus_food" ON surplus_food;
CREATE POLICY "read_surplus_food" ON surplus_food FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_surplus_food" ON surplus_food;
CREATE POLICY "insert_own_surplus_food" ON surplus_food FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "update_own_surplus_food" ON surplus_food;
CREATE POLICY "update_own_surplus_food" ON surplus_food FOR UPDATE
  TO authenticated USING (auth.uid() = citizen_id) WITH CHECK (auth.uid() = citizen_id);

-- NGO can update (accept/collect/reject) surplus food
DROP POLICY IF EXISTS "ngo_update_surplus_food" ON surplus_food;
CREATE POLICY "ngo_update_surplus_food" ON surplus_food FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'ngo')
  ) WITH CHECK (true);

-- ============ REWARDS ============
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points integer NOT NULL DEFAULT 0,
  reason text NOT NULL DEFAULT '',
  awarded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_rewards" ON rewards;
CREATE POLICY "read_rewards" ON rewards FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR awarded_by = auth.uid());

-- Admin can insert rewards for any user
DROP POLICY IF EXISTS "admin_insert_rewards" ON rewards;
CREATE POLICY "admin_insert_rewards" ON rewards FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ LEARNING MODULES ============
CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  age_group text NOT NULL CHECK (age_group IN ('kids', 'teens')),
  level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  content jsonb NOT NULL DEFAULT '{}',
  video_url text DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_learning_modules" ON learning_modules;
CREATE POLICY "read_learning_modules" ON learning_modules FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_manage_learning_modules" ON learning_modules;
CREATE POLICY "admin_manage_learning_modules" ON learning_modules FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_learning_modules" ON learning_modules;
CREATE POLICY "admin_update_learning_modules" ON learning_modules FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============ QUIZ QUESTIONS ============
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_index integer NOT NULL DEFAULT 0,
  explanation text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_quiz_questions" ON quiz_questions;
CREATE POLICY "read_quiz_questions" ON quiz_questions FOR SELECT
  TO authenticated USING (true);

-- ============ QUIZ ATTEMPTS ============
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid REFERENCES learning_modules(id) ON DELETE SET NULL,
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quiz_attempts" ON quiz_attempts;
CREATE POLICY "select_own_quiz_attempts" ON quiz_attempts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_quiz_attempts" ON quiz_attempts;
CREATE POLICY "insert_own_quiz_attempts" ON quiz_attempts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ CERTIFICATES ============
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  certificate_type text NOT NULL DEFAULT 'course_completion',
  module_id uuid REFERENCES learning_modules(id) ON DELETE SET NULL,
  issued_at timestamptz DEFAULT now(),
  certificate_number text NOT NULL DEFAULT ''
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_certificates" ON certificates;
CREATE POLICY "select_own_certificates" ON certificates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_waste_reports_status ON waste_reports(status);
CREATE INDEX IF NOT EXISTS idx_waste_reports_reporter ON waste_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_recyclable_status ON recyclable_listings(status);
CREATE INDEX IF NOT EXISTS idx_surplus_food_status ON surplus_food(status);
CREATE INDEX IF NOT EXISTS idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_locations_driver ON vehicle_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_modules_age ON learning_modules(age_group, order_index);

-- ============ TRIGGER: auto-create profile on signup ============
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============ TRIGGER: update updated_at ============
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_waste_reports_updated ON waste_reports;
CREATE TRIGGER trigger_waste_reports_updated
  BEFORE UPDATE ON waste_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_profiles_updated ON profiles;
CREATE TRIGGER trigger_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();