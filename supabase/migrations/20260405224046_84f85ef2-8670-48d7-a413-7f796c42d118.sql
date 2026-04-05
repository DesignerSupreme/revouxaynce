
-- Add billing_type column
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'single' CHECK (billing_type IN ('single', 'milestone'));

-- Add milestones JSON array
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '[]'::jsonb;

-- Add version tracking
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- Add parent_id for revision chain
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;

-- Index for fast revision lookups
CREATE INDEX IF NOT EXISTS idx_invoices_parent_id ON public.invoices(parent_id);
