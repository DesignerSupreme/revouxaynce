revoke all on function public.has_role(uuid, public.app_role) from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.can_write() from public, anon, authenticated;
revoke all on function public.can_assist() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.portal_invoice_access(uuid) from public, anon, authenticated;