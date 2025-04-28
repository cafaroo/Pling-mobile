/*
  # Create sales table with safe policy creation

  1. New Tables
    - `sales`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `amount` (numeric)
      - `product` (text, optional)
      - `comment` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sales` table
    - Add policies for authenticated users to:
      - Read their own sales
      - Insert their own sales
      - Update their own sales
      - Delete their own sales

  3. Triggers
    - Add updated_at trigger
*/

-- Create sales table if it doesn't exist
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

-- Safely create policies
DO $$ BEGIN
    -- Read policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' 
        AND policyname = 'Users can read own sales'
    ) THEN
        CREATE POLICY "Users can read own sales"
            ON public.sales
            FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;

    -- Insert policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' 
        AND policyname = 'Users can insert own sales'
    ) THEN
        CREATE POLICY "Users can insert own sales"
            ON public.sales
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Update policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' 
        AND policyname = 'Users can update own sales'
    ) THEN
        CREATE POLICY "Users can update own sales"
            ON public.sales
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sales' 
        AND policyname = 'Users can delete own sales'
    ) THEN
        CREATE POLICY "Users can delete own sales"
            ON public.sales
            FOR DELETE
            TO authenticated
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_sales_updated_at'
    ) THEN
        CREATE TRIGGER update_sales_updated_at
            BEFORE UPDATE ON public.sales
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;