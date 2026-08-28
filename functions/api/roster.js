SELECT 
  id,
  username,
  role,
  avatar_url,
  joined_at,
  -- Calculates if joined within the last 14 days (1 = true, 0 = false)
  (julianday('now') - julianday(joined_at) <= 14) AS is_new
FROM roster_members
ORDER BY 
  CASE role
    WHEN 'Leader'  THEN 1
    WHEN 'Admin'   THEN 2
    WHEN 'Officer' THEN 3
    WHEN 'Member'  THEN 4
    ELSE 5
  END ASC,
  username ASC;
