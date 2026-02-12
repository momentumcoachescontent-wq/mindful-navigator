-- Create a function to enforce admin premium status
CREATE OR REPLACE FUNCTION public.enforce_admin_premium()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is an admin, forcedly set is_premium to true
  -- This protects against external services (like Stripe webhooks or Edge Functions) 
  -- accidentally waiting to downgrade an admin.
  IF NEW.is_admin = true THEN
    NEW.is_premium := true;
    -- Optional: extend premium_until if it's null or expiring
    IF NEW.premium_until IS NULL OR NEW.premium_until < now() THEN
       NEW.premium_until := now() + interval '100 years';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_enforce_admin_premium ON public.profiles;

CREATE TRIGGER trg_enforce_admin_premium
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_admin_premium();

-- Manually update existing admins to ensure consistency immediately
UPDATE public.profiles
SET is_premium = true
WHERE is_admin = true;
