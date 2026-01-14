-- Seed sample task categories and items for testing
-- This migration creates example data for task management features
-- Insert a sample task category for user 1 (tim)
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
VALUES (
    1,
    'Work Tasks',
    'task',
    '💼',
    'blue',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );
-- Get the category ID (SQLite specific)
-- In SQLite, last_insert_rowid() would be used in application code
-- For this migration, we'll assume category_id = 1 for the new category
-- Insert fields for the Work Tasks category
INSERT INTO fields (
    category_id,
    name,
    field_type,
    options,
    field_order,
    created_at
  )
VALUES (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 'Task Title', 'text', NULL,
    0,
    CURRENT_TIMESTAMP
  ),
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 'Description', 'text', NULL,
    1,
    CURRENT_TIMESTAMP
  );
-- Insert sample tasks with various priorities and real-life scenarios
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
VALUES -- Urgent: Doctor appointment follow-up
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'urgent',
    datetime('now', '+2 days'),
    30,
    0,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- High: Buy birthday gift (assigned to partner)
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, 2, 'high', datetime('now', '+5 days'), 60, 0, NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- Medium: Weekly grocery shopping (recurring)
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'medium',
    datetime('now', '+3 days'),
    90,
    0,
    NULL,
    '{"frequency":"weekly","interval":1}',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- Low: Organize photo albums
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'low',
    datetime('now', '+14 days'),
    120,
    0,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- High: Pay rent (recurring monthly)
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'high',
    datetime('now', '+25 days'),
    15,
    0,
    NULL,
    '{"frequency":"monthly","interval":1}',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- Medium: Schedule car maintenance
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'medium',
    datetime('now', '+10 days'),
    45,
    0,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- Urgent: File tax documents
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'urgent',
    datetime('now', '+7 days'),
    180,
    0,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- Low: Research vacation destinations
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'low',
    NULL,
    60,
    0,
    NULL,
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  -- Archived: Renewed gym membership (completed)
  (
    (
      SELECT id
      FROM categories
      WHERE name = 'Work Tasks'
        AND user_id = 1
      LIMIT 1
    ), 1, NULL,
    'high',
    datetime('now', '-2 days'),
    30,
    1,
    datetime('now', '-1 days'),
    NULL,
    NULL,
    datetime('now', '-5 days'),
    datetime('now', '-1 days')
  );
-- Insert field values for the tasks
-- We need to insert them in order, so we'll use row_number approach via created_at ordering
-- Task 1: Urgent - Doctor appointment follow-up
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 0
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Call doctor for test results', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 0
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Follow up on blood work from last week', CURRENT_TIMESTAMP;
-- Task 2: High - Buy birthday gift (assigned to jule)
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 1
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Buy birthday gift for Mom', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 1
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Get something nice for her 60th birthday party', CURRENT_TIMESTAMP;
-- Task 3: Medium - Weekly grocery shopping
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 2
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Weekly grocery shopping', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 2
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Buy fresh vegetables, fruits, and essentials', CURRENT_TIMESTAMP;
-- Task 4: Low - Organize photo albums
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 3
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Organize digital photo albums', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 3
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Sort through vacation photos from 2024-2025', CURRENT_TIMESTAMP;
-- Task 5: High - Pay rent
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 4
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Pay monthly rent', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 4
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Transfer rent payment before the 1st', CURRENT_TIMESTAMP;
-- Task 6: Medium - Schedule car maintenance
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 5
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Schedule car service appointment', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 5
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Oil change and tire rotation due', CURRENT_TIMESTAMP;
-- Task 7: Urgent - File tax documents
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 6
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Prepare and file tax return', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 6
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Gather receipts and submit 2025 tax forms', CURRENT_TIMESTAMP;
-- Task 8: Low - Research vacation destinations
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 7
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Research summer vacation spots', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 7
  ),
  (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Look into Greece, Portugal, or Croatia options', CURRENT_TIMESTAMP;
-- Task 9: Archived - Renewed gym membership
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
      AND is_archived = 1
    LIMIT 1
  ), (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Renew gym membership', CURRENT_TIMESTAMP
UNION ALL
SELECT (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
      AND is_archived = 1
    LIMIT 1
  ), (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = 1
        LIMIT 1
      )
    LIMIT 1
  ), 'Renewed annual membership at FitnessPro', CURRENT_TIMESTAMP;