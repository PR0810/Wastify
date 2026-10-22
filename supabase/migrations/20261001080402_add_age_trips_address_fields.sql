-- Add age column to profiles for age-based learning
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age integer DEFAULT null;

-- Add address fields to driver_assignments for detailed assignment info
ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS house_no text DEFAULT '';
ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS full_address text DEFAULT '';
ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS city text DEFAULT '';

-- Create trips table for waste collection trips
CREATE TABLE IF NOT EXISTS collection_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  area_id uuid REFERENCES areas(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  waste_collected_kg double precision DEFAULT 0,
  dropoff_location text DEFAULT '',
  notes text DEFAULT '',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE collection_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_collection_trips" ON collection_trips;
CREATE POLICY "read_collection_trips" ON collection_trips FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "driver_insert_trips" ON collection_trips;
CREATE POLICY "driver_insert_trips" ON collection_trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = driver_id);

DROP POLICY IF EXISTS "driver_update_trips" ON collection_trips;
CREATE POLICY "driver_update_trips" ON collection_trips FOR UPDATE
  TO authenticated USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);

CREATE INDEX IF NOT EXISTS idx_collection_trips_driver ON collection_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_collection_trips_status ON collection_trips(status);