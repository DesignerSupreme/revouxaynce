
-- Add last_sent_at column
ALTER TABLE public.invoices ADD COLUMN last_sent_at TIMESTAMP WITH TIME ZONE;

-- Update status constraint to include Revision Requested
ALTER TABLE public.invoices DROP CONSTRAINT invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('Draft', 'Quotation', 'Sent', 'Paid', 'Overdue', 'Revision Requested'));

-- Create function to mark overdue invoices
CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invoices
  SET status = 'Overdue'
  WHERE status IN ('Sent', 'Quotation')
    AND due_date < to_char(now(), 'YYYY-MM-DD')
    AND status != 'Paid';
END;
$$;
