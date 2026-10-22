CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, age)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'age')::integer, NULL)
  );
  RETURN NEW;
END;
$$;