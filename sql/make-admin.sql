-- Make yourself admin
-- Replace 'YOUR_EMAIL@example.com' with your actual email address

UPDATE profiles 
SET is_admin = true 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
);

-- Verify it worked (should show is_admin = true)
SELECT id, username, is_admin FROM profiles WHERE is_admin = true;
