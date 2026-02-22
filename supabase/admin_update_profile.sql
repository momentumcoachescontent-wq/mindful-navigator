-- Secure RPC for Admins to update user profiles (Premium / Admin status)
-- This bypasses the normal RLS UPDATE policy which only allows users to edit their OWN profile.

CREATE OR REPLACE FUNCTION public.admin_update_profile_status(
    p_target_user_id UUID,
    p_is_premium BOOLEAN DEFAULT NULL,
    p_is_admin BOOLEAN DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS
SET search_path = public
AS $$
DECLARE
    v_is_caller_admin BOOLEAN;
BEGIN
    -- 1. Check if the caller is an active Admin
    SELECT is_admin INTO v_is_caller_admin 
    FROM public.profiles 
    WHERE user_id = auth.uid();

    IF v_is_caller_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Access denied. Only administrators can perform this action.';
    END IF;

    -- 2. Update the target profile
    IF p_is_premium IS NOT NULL THEN
        UPDATE public.profiles SET is_premium = p_is_premium WHERE id = p_target_user_id;
    END IF;

    IF p_is_admin IS NOT NULL THEN
        -- Prevent an admin from accidentally revoking their own admin access via this generic script if they meant to test
        IF p_target_user_id = auth.uid() AND p_is_admin = false THEN
           RAISE EXCEPTION 'You cannot revoke your own admin privileges directly through this endpoint for safety.';
        END IF;
        
        UPDATE public.profiles SET is_admin = p_is_admin WHERE id = p_target_user_id;
    END IF;

END;
$$;
