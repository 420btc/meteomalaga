-- Create a function to handle username-based authentication
CREATE OR REPLACE FUNCTION handle_username_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract username from the email (username@meteormalaga.app)
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{username}',
    to_jsonb(split_part(NEW.email, '@', 1))
  );
  
  -- Set default avatar if not provided
  IF NOT (NEW.raw_user_meta_data ? 'avatar_url') THEN
    NEW.raw_user_meta_data = jsonb_set(
      NEW.raw_user_meta_data,
      '{avatar_url}',
      '"https://api.dicebear.com/7.x/avataaars/svg?seed=' || split_part(NEW.email, '@', 1) || '"'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically set username from email
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_username_auth();

-- Create a function to create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, email, coins)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    1000
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a user profile
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update the users table to make email optional
ALTER TABLE public.users
ALTER COLUMN email DROP NOT NULL;

-- Add a unique constraint on username
ALTER TABLE public.users
ADD CONSTRAINT users_username_key UNIQUE (username);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.users TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION handle_username_auth() TO anon, authenticated, service_role;
