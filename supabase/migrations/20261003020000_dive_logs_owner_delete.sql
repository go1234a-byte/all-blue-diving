create policy "dive_logs_delete_own" on public.dive_logs
  for delete using (auth.uid() = user_id);
