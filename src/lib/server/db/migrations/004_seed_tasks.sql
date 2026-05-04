-- Seed sample task categories and items for testing
-- This migration creates example data for task management features
-- Only run if user "tim" exists
-- Insert a sample task category for user "tim"
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
  'Work Tasks',
  'task',
  '💼',
  'blue',
  FALSE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'tim'
  AND NOT EXISTS (
    SELECT 1
    FROM categories
    WHERE name = 'Work Tasks'
      AND user_id = u.id
  );
-- Insert fields for the Work Tasks category
-- Only insert if category exists and fields don't already exist
INSERT INTO fields (
    category_id,
    name,
    field_type,
    options,
    field_order,
    created_at
  )
SELECT cat.id,
  'Task Title',
  'text',
  NULL,
  0,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
      AND f.name = 'Task Title'
  )
UNION ALL
SELECT cat.id,
  'Description',
  'text',
  NULL,
  1,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
      AND f.name = 'Description'
  );
-- Insert sample tasks with various priorities and real-life scenarios
-- Only insert if category exists and items don't already exist
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
  ), NULL::INTEGER,
  'urgent'::TEXT,
  (NOW() + INTERVAL '2 days')::TIMESTAMPTZ,
  30,
  FALSE,
  NULL::TIMESTAMPTZ,
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'high'::TEXT,
  (NOW() + INTERVAL '5 days')::TIMESTAMPTZ,
  60,
  FALSE,
  NULL::TIMESTAMPTZ,
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'medium'::TEXT,
  (NOW() + INTERVAL '3 days')::TIMESTAMPTZ,
  90,
  FALSE,
  NULL::TIMESTAMPTZ,
  '{"frequency":"weekly","interval":1}'::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'low'::TEXT,
  (NOW() + INTERVAL '14 days')::TIMESTAMPTZ,
  120,
  FALSE,
  NULL::TIMESTAMPTZ,
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'high'::TEXT,
  (NOW() + INTERVAL '25 days')::TIMESTAMPTZ,
  15,
  FALSE,
  NULL::TIMESTAMPTZ,
  '{"frequency":"monthly","interval":1}'::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'medium'::TEXT,
  (NOW() + INTERVAL '10 days')::TIMESTAMPTZ,
  45,
  FALSE,
  NULL::TIMESTAMPTZ,
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'urgent'::TEXT,
  (NOW() + INTERVAL '7 days')::TIMESTAMPTZ,
  180,
  FALSE,
  NULL::TIMESTAMPTZ,
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'low'::TEXT,
  NULL::TIMESTAMPTZ,
  60,
  FALSE,
  NULL::TIMESTAMPTZ,
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  )
UNION ALL
SELECT cat.id,
  (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  ), NULL::INTEGER,
  'high'::TEXT,
  (NOW() - INTERVAL '2 days')::TIMESTAMPTZ,
  30,
  TRUE,
  (NOW() - INTERVAL '1 days')::TIMESTAMPTZ,
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  (NOW() - INTERVAL '5 days')::TIMESTAMPTZ,
  (NOW() - INTERVAL '1 days')::TIMESTAMPTZ
FROM categories cat
WHERE cat.name = 'Work Tasks'
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
    LIMIT 1
  );
-- Insert field values for the tasks
-- Only insert if category, items, and fields exist
-- Task 1: Urgent - Doctor appointment follow-up
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Call doctor for test results',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 0
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Follow up on blood work from last week',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 0
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 2: High - Buy birthday gift (assigned to jule)
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Buy birthday gift for Mom',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Get something nice for her 60th birthday party',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 3: Medium - Weekly grocery shopping
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Weekly grocery shopping',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 2
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Buy fresh vegetables, fruits, and essentials',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 2
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 4: Low - Organize photo albums
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Organize digital photo albums',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 3
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Sort through vacation photos from 2024-2025',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 3
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 5: High - Pay rent
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Pay monthly rent',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 4
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Transfer rent payment before the 1st',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 4
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 6: Medium - Schedule car maintenance
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Schedule car service appointment',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 5
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Oil change and tire rotation due',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 5
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 7: Urgent - File tax documents
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Prepare and file tax return',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 6
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Gather receipts and submit 2025 tax forms',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 6
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 8: Low - Research vacation destinations
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Research summer vacation spots',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 7
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Look into Greece, Portugal, or Croatia options',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    ORDER BY id
    LIMIT 1 OFFSET 7
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );
-- Task 9: Archived - Renewed gym membership
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_title.id,
  'Renew gym membership',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND is_archived = TRUE
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Task Title'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_title
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_title.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_title.id
  )
UNION ALL
SELECT item.id,
  field_desc.id,
  'Renewed annual membership at FitnessPro',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND is_archived = TRUE
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Description'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Work Tasks'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_desc
WHERE cat.name = 'Work Tasks'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_desc.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_desc.id
  );