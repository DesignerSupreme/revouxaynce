
-- Add reminder, internal notes, and assignment columns to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz DEFAULT NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS internal_notes text DEFAULT '';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS assigned_to text DEFAULT '';

-- Create invoice_comments table for team discussion
CREATE TABLE public.invoice_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  author text NOT NULL DEFAULT 'admin',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_comments ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can interact with comments
CREATE POLICY "Authenticated users can read comments"
  ON public.invoice_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON public.invoice_comments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete comments"
  ON public.invoice_comments FOR DELETE TO authenticated USING (true);

-- Index for fast comment lookups
CREATE INDEX idx_invoice_comments_invoice_id ON public.invoice_comments(invoice_id);
