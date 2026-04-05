
-- 1. Update invoices table: add discount_type and discount_value columns
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'flat' CHECK (discount_type IN ('percent', 'flat'));
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;

-- 2. Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by text DEFAULT 'system',
  details text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audit logs"
  ON public.audit_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT TO anon WITH CHECK (true);

CREATE INDEX idx_audit_logs_invoice_id ON public.audit_logs(invoice_id);

-- 3. Create brand_settings table
CREATE TABLE public.brand_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accent_color text DEFAULT '#000000',
  footer_text text DEFAULT 'Thank you for your business.',
  terms_and_conditions text DEFAULT 'Payment is due upon receipt unless otherwise specified.',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brand settings"
  ON public.brand_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update brand settings"
  ON public.brand_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert brand settings"
  ON public.brand_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Insert default brand settings row
INSERT INTO public.brand_settings (accent_color, footer_text, terms_and_conditions)
VALUES ('#000000', 'Thank you for your business.', 'Payment is due upon receipt unless otherwise specified.');

-- Add updated_at trigger for brand_settings
CREATE TRIGGER update_brand_settings_updated_at
  BEFORE UPDATE ON public.brand_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
