/*
  # Add image URL column to competitions table
  
  1. Changes
    - Add image_url column to competitions table
    - Make it nullable since not all competitions need images
*/

-- Add image_url column to competitions table
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS image_url text;