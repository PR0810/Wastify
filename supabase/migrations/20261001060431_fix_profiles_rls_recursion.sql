-- Fix: admin_read_all_profiles causes infinite RLS recursion by querying
-- profiles from within a profiles SELECT policy. Replace with a
-- SECURITY DEFINER function that bypasses RLS.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;

-- Recreate using the non-recursive function
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (is_admin());

-- Also fix other tables that have the same recursive pattern
-- areas
DROP POLICY IF EXISTS "admin_manage_areas" ON areas;
CREATE POLICY "admin_manage_areas" ON areas FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_areas" ON areas;
CREATE POLICY "admin_update_areas" ON areas FOR UPDATE
  TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "admin_delete_areas" ON areas;
CREATE POLICY "admin_delete_areas" ON areas FOR DELETE
  TO authenticated USING (is_admin());

-- driver_assignments
DROP POLICY IF EXISTS "admin_insert_driver_assignments" ON driver_assignments;
CREATE POLICY "admin_insert_driver_assignments" ON driver_assignments FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_driver_assignments" ON driver_assignments;
CREATE POLICY "admin_update_driver_assignments" ON driver_assignments FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_driver_assignments" ON driver_assignments;
CREATE POLICY "admin_delete_driver_assignments" ON driver_assignments FOR DELETE
  TO authenticated USING (is_admin());

-- waste_reports admin update
DROP POLICY IF EXISTS "admin_update_waste_reports" ON waste_reports;
CREATE POLICY "admin_update_waste_reports" ON waste_reports FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (true);

-- rewards admin insert
DROP POLICY IF EXISTS "admin_insert_rewards" ON rewards;
CREATE POLICY "admin_insert_rewards" ON rewards FOR INSERT
  TO authenticated WITH CHECK (is_admin());

-- learning_modules admin
DROP POLICY IF EXISTS "admin_manage_learning_modules" ON learning_modules;
CREATE POLICY "admin_manage_learning_modules" ON learning_modules FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_learning_modules" ON learning_modules;
CREATE POLICY "admin_update_learning_modules" ON learning_modules FOR UPDATE
  TO authenticated USING (is_admin());

-- Similarly, fix NGO policies that query profiles recursively
CREATE OR REPLACE FUNCTION is_ngo()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ngo'
  );
$$;

DROP POLICY IF EXISTS "ngo_update_recyclable" ON recyclable_listings;
CREATE POLICY "ngo_update_recyclable" ON recyclable_listings FOR UPDATE
  TO authenticated USING (is_ngo()) WITH CHECK (true);

DROP POLICY IF EXISTS "ngo_update_surplus_food" ON surplus_food;
CREATE POLICY "ngo_update_surplus_food" ON surplus_food FOR UPDATE
  TO authenticated USING (is_ngo()) WITH CHECK (true);

-- Fix driver policy on waste_reports that also queries profiles recursively
CREATE OR REPLACE FUNCTION is_driver()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'driver'
  );
$$;

DROP POLICY IF EXISTS "driver_update_waste_reports" ON waste_reports;
CREATE POLICY "driver_update_waste_reports" ON waste_reports FOR UPDATE
  TO authenticated USING (assigned_to = auth.uid() OR is_driver()) WITH CHECK (true);
