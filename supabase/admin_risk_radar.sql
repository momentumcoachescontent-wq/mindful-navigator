-- SQL Script for Data Mining: Risk Radar
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_admin_risk_radar(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  entry_id UUID,
  user_id UUID,
  display_name TEXT,
  email TEXT,
  content TEXT,
  risk_level TEXT,
  matched_keywords TEXT,
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

  RETURN QUERY
  WITH flagged_entries AS (
    SELECT 
      j.id,
      j.user_id,
      j.content,
      j.created_at,
      -- High Risk Keywords detection
      CASE 
        WHEN j.content ~* '\y(suicidio|matarme|morir|ya no puedo mas|rendirme|desesperacion|quitarmela vida|acabar con todo)\y' THEN 'Alto'
        WHEN j.content ~* '\y(depresion|ansiedad|panico|vacio|soledad extrema|dolor insoportable|crisis|llorar sin parar|no tiene sentido)\y' THEN 'Medio'
        ELSE 'Bajo'
      END as risk_level,
      -- Extraction of matched keywords for context (simple approach)
      array_to_string(ARRAY(
        SELECT DISTINCT match[1] 
        FROM regexp_matches(lower(j.content), '\y(suicidio|matarme|morir|ya no puedo mas|rendirme|desesperacion|quitarmela vida|acabar con todo|depresion|ansiedad|panico|vacio|soledad extrema|dolor insoportable|crisis|llorar sin parar|no tiene sentido)\y', 'g') as match
      ), ', ') as matched_keywords
    FROM public.journal_entries j
    WHERE j.created_at >= (now() - (days_back || ' days')::interval)
  )
  SELECT 
    fe.id as entry_id,
    fe.user_id,
    p.display_name,
    u.email::TEXT,
    fe.content,
    fe.risk_level,
    fe.matched_keywords,
    fe.created_at
  FROM flagged_entries fe
  JOIN public.profiles p ON p.user_id = fe.user_id
  JOIN auth.users u ON u.id = fe.user_id
  WHERE fe.risk_level IN ('Alto', 'Medio')
  ORDER BY 
    CASE WHEN fe.risk_level = 'Alto' THEN 1 ELSE 2 END,
    fe.created_at DESC
  LIMIT 50;
END;
$$;
