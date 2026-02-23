-- SQL Script for Data Mining: Journal Search
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_admin_journal_search(search_term TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  entry_id UUID,
  user_id UUID,
  display_name TEXT,
  email TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- AUTH CHECK
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE profiles.user_id = auth.uid();
  IF v_is_admin IS NOT TRUE THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Ensure search_term is not dangerously empty to prevent massive fulltable scans
  IF length(trim(search_term)) < 3 THEN
    RETURN; -- Returns empty if the search term is too short
  END IF;

  RETURN QUERY
  SELECT 
    j.id as entry_id,
    j.user_id,
    p.display_name,
    u.email::TEXT,
    j.content,
    j.created_at
  FROM public.journal_entries j
  JOIN public.profiles p ON p.user_id = j.user_id
  JOIN auth.users u ON u.id = j.user_id
  WHERE j.created_at >= (now() - (days_back || ' days')::interval)
    AND j.content ILIKE '%' || search_term || '%'
  ORDER BY j.created_at DESC
  LIMIT 100;
END;
$$;
