/*
  # Add competition categories and status

  1. New Tables
    - `competition_categories`
      - Categories for organizing competitions
      - Color themes for visual distinction
    
  2. Changes
    - Add category and status to competitions table
    - Add helper functions for competition status
*/

-- Create competition categories table
CREATE TABLE IF NOT EXISTS public.competition_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    color text NOT NULL,
    icon text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Add category to competitions
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES competition_categories(id),
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('draft', 'upcoming', 'active', 'ended'));

-- Enable RLS
ALTER TABLE public.competition_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view competition categories"
ON competition_categories
FOR SELECT
TO public
USING (true);

-- Create function to get competition status
CREATE OR REPLACE FUNCTION get_competition_status(
    start_date timestamptz,
    end_date timestamptz
)
RETURNS text
LANGUAGE sql
STABLE
AS $$
    SELECT
        CASE
            WHEN now() < start_date THEN 'upcoming'
            WHEN now() > end_date THEN 'ended'
            ELSE 'active'
        END;
$$;

-- Insert default categories
INSERT INTO competition_categories (name, description, color, icon) VALUES
    ('Sales', 'Sales performance competitions', '#10B981', 'trending-up'),
    ('Team Building', 'Team collaboration challenges', '#8B5CF6', 'users'),
    ('Customer Success', 'Customer satisfaction goals', '#F59E0B', 'heart'),
    ('Innovation', 'New ideas and improvements', '#EC4899', 'lightbulb')
ON CONFLICT DO NOTHING;