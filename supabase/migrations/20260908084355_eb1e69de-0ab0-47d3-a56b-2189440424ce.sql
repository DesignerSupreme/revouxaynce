revoke all on function public.rotate_portal_token(uuid) from public, anon;
grant execute on function public.rotate_portal_token(uuid) to authenticated;

revoke all on function public.backfill_portal_tokens() from public, anon;
grant execute on function public.backfill_portal_tokens() to authenticated;

revoke all on function public.mark_overdue_invoices() from public, anon;
grant execute on function public.mark_overdue_invoices() to authenticated;

revoke all on function public.stamp_audit_log_actor() from public, anon;