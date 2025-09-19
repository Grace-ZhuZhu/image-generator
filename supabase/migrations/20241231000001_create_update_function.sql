-- Create the update_updated_at_column function if it doesn't exist
-- This is a generic function that can be used by any table with an updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Enable uuid-ossp extension if not already enabled
-- This extension provides UUID generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant necessary permissions for the function
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO service_role;
