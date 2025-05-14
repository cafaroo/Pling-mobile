/*
  # Create sales table and security policies

  1. New Tables
    - `sales`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `amount` (numeric, not null)
      - `product` (text)
      - `comment` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `sales` table
    - Add policies for:
      - Select: Users can read their own sales
      - Insert: Users can insert their own sales
      - Update: Users can update their own sales
      - Delete: Users can delete their own sales

  3. Triggers
    - Add trigger to update `updated_at` timestamp
*/

-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    product text,
    comment text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own sales"
    ON public.sales
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales"
    ON public.sales
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales"
    ON public.sales
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
    ON public.sales
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();