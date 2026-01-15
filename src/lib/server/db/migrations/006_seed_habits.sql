-- Seed sample habit categories and items for testing
-- This migration creates example data for habit tracking features
-- Only run if user "tim" exists
-- Insert a sample habit category for user "tim"
INSERT INTO categories (
    user_id,
    name,
    template_type,
    icon,
    color,
    is_private,
    created_at,
    updated_at
  )
SELECT u.id,
  'Fitness Habits',
  'habit',
  '🏃',
  'purple',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'tim'
  AND NOT EXISTS (
    SELECT 1
    FROM categories
    WHERE name = 'Fitness Habits'
      AND user_id = u.id
  );
-- Insert fields for the Fitness Habits category
INSERT INTO fields (
    category_id,
    name,
    field_type,
    options,
    field_order,
    created_at
  )
SELECT cat.id,
  'Habit Name',
  'text',
  NULL,
  0,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Fitness Habits'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM fields f
    WHERE f.category_id = cat.id
      AND f.name = 'Habit Name'
  )
UNION ALL
SELECT cat.id,
  'Goal',
  'text',
  NULL,
  1,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Fitness Habits'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM fields f
    WHERE f.category_id = cat.id
      AND f.name = 'Goal'
  )
UNION ALL
SELECT cat.id,
  'Is Good Habit',
  'boolean',
  NULL,
  2,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Fitness Habits'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM fields f
    WHERE f.category_id = cat.id
      AND f.name = 'Is Good Habit'
  );
-- Insert sample habits
INSERT INTO items (
    category_id,
    user_id,
    assigned_to_user_id,
    priority,
    deadline,
    time_estimate,
    is_archived,
    completed_at,
    recurring_config,
    next_show_date,
    created_at,
    updated_at
  )
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL,
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Fitness Habits'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM items i
    WHERE i.category_id = cat.id
      AND i.user_id = (
        SELECT id
        FROM users
        WHERE username = 'tim'
        LIMIT 1
      )
  )
LIMIT 3;
-- Insert field values for habits
-- Habit 1: Morning Run (good habit)
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'Morning Run',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Habit Name'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'Run 5km every morning',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Goal'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id = (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND fv.value = 'Morning Run'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'true',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Is Good Habit'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id = (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND fv.value = 'Morning Run'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
-- Habit 2: Skip Breakfast (bad habit)
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'Skip Breakfast',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Habit Name'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id NOT IN (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND fv.value = 'Morning Run'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'Avoid skipping breakfast',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Goal'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id = (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND fv.value = 'Skip Breakfast'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'false',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Is Good Habit'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id = (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND fv.value = 'Skip Breakfast'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
-- Habit 3: Drink Water (good habit)
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'Drink Water',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Habit Name'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id NOT IN (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND (
        fv.value = 'Morning Run'
        OR fv.value = 'Skip Breakfast'
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'Drink 8 glasses of water daily',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Goal'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id = (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND fv.value = 'Drink Water'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT i.id,
  f.id,
  'true',
  CURRENT_TIMESTAMP
FROM items i
  JOIN categories cat ON cat.id = i.category_id
  JOIN fields f ON f.category_id = cat.id
WHERE cat.name = 'Fitness Habits'
  AND f.name = 'Is Good Habit'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND i.id = (
    SELECT i2.id
    FROM items i2
      JOIN field_values fv ON fv.item_id = i2.id
      JOIN fields f2 ON f2.id = fv.field_id
    WHERE f2.name = 'Habit Name'
      AND fv.value = 'Drink Water'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = i.id
      AND fv.field_id = f.id
  )
LIMIT 1;
-- Insert sample habit entries for "Morning Run" habit
-- Create entries for the last 30 days with some gaps to test streak calculation
INSERT INTO habit_entries (item_id, logged_date, status, notes, created_at)
SELECT i.id,
  date(
    'now',
    '-' || (
      30 - row_number() OVER (
        ORDER BY random()
      )
    ) || ' days'
  ),
  CASE
    WHEN random() < 0.7 THEN 'done'
    WHEN random() < 0.9 THEN 'skipped'
    ELSE 'failed'
  END,
  CASE
    WHEN random() < 0.3 THEN 'Great run today!'
    WHEN random() < 0.6 THEN 'Felt good'
    ELSE NULL
  END,
  CURRENT_TIMESTAMP
FROM items i
  JOIN field_values fv ON fv.item_id = i.id
  JOIN fields f ON f.id = fv.field_id
WHERE f.name = 'Habit Name'
  AND fv.value = 'Morning Run'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM habit_entries he
    WHERE he.item_id = i.id
  )
LIMIT 25;
-- Insert sample entries for "Drink Water" habit (more consistent)
INSERT INTO habit_entries (item_id, logged_date, status, notes, created_at)
SELECT i.id,
  date(
    'now',
    '-' || (
      20 - row_number() OVER (
        ORDER BY random()
      )
    ) || ' days'
  ),
  CASE
    WHEN random() < 0.85 THEN 'done'
    WHEN random() < 0.95 THEN 'skipped'
    ELSE 'failed'
  END,
  CASE
    WHEN random() < 0.2 THEN 'Drank all 8 glasses'
    ELSE NULL
  END,
  CURRENT_TIMESTAMP
FROM items i
  JOIN field_values fv ON fv.item_id = i.id
  JOIN fields f ON f.id = fv.field_id
WHERE f.name = 'Habit Name'
  AND fv.value = 'Drink Water'
  AND i.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1
    FROM habit_entries he
    WHERE he.item_id = i.id
  )
LIMIT 18;