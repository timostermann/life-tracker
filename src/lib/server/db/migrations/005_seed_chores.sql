-- Seed sample chore categories and items for testing
-- This migration creates example data for chore management features
-- Only run if user "tim" exists
-- Insert a sample chore category for user "tim"
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
  'Household Chores',
  'chore',
  '🧹',
  'green',
  FALSE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'tim'
  AND NOT EXISTS (
    SELECT 1
    FROM categories
    WHERE name = 'Household Chores'
      AND user_id = u.id
  );
-- Insert fields for the Household Chores category
INSERT INTO fields (
    category_id,
    name,
    field_type,
    options,
    field_order,
    created_at
  )
SELECT cat.id,
  'Chore Name',
  'text',
  NULL,
  0,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Household Chores'
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
      AND f.name = 'Chore Name'
  )
UNION ALL
SELECT cat.id,
  'Notes',
  'text',
  NULL,
  1,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Household Chores'
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
      AND f.name = 'Notes'
  );
-- Insert sample chores with various recurring frequencies
-- Chores MUST have recurring_config (required)
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
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  NULL::INTEGER,
  FALSE,
  NULL::TIMESTAMPTZ,
  '{"frequency":"weekly","interval":1}'::TEXT,
  (NOW() + INTERVAL '7 days')::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Household Chores'
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
      AND i.recurring_config = '{"frequency":"weekly","interval":1}'
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
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  NULL::INTEGER,
  FALSE,
  NULL::TIMESTAMPTZ,
  '{"frequency":"weekly","interval":2}'::TEXT,
  (NOW() + INTERVAL '14 days')::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Household Chores'
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
      AND i.recurring_config = '{"frequency":"weekly","interval":2}'
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
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  NULL::INTEGER,
  FALSE,
  NULL::TIMESTAMPTZ,
  '{"frequency":"monthly","interval":1}'::TEXT,
  (NOW() + INTERVAL '1 month')::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Household Chores'
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
      AND i.recurring_config = '{"frequency":"monthly","interval":1}'
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
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  NULL::INTEGER,
  FALSE,
  NULL::TIMESTAMPTZ,
  '{"frequency":"daily","interval":1}'::TEXT,
  (NOW() + INTERVAL '1 day')::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Household Chores'
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
      AND i.recurring_config = '{"frequency":"daily","interval":1}'
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
  NULL::TEXT,
  NULL::TIMESTAMPTZ,
  NULL::INTEGER,
  FALSE,
  NULL::TIMESTAMPTZ,
  '{"frequency":"monthly","interval":3}'::TEXT,
  (NOW() + INTERVAL '3 months')::TIMESTAMPTZ,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories cat
WHERE cat.name = 'Household Chores'
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
      AND i.recurring_config = '{"frequency":"monthly","interval":3}'
    LIMIT 1
  );
-- Insert field values for chores
-- Weekly: Vacuum floors
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_name.id,
  'Vacuum floors',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"weekly","interval":1}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Chore Name'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_name
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_name.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_name.id
  )
UNION ALL
SELECT item.id,
  field_notes.id,
  'Focus on high-traffic areas',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"weekly","interval":1}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Notes'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_notes
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_notes.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_notes.id
  );
-- Bi-weekly: Clean bathroom
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_name.id,
  'Clean bathroom',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"weekly","interval":2}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Chore Name'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_name
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_name.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_name.id
  )
UNION ALL
SELECT item.id,
  field_notes.id,
  'Scrub shower, sink, and toilet',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"weekly","interval":2}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Notes'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_notes
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_notes.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_notes.id
  );
-- Monthly: Change air filter
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_name.id,
  'Change air filter',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"monthly","interval":1}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Chore Name'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_name
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_name.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_name.id
  )
UNION ALL
SELECT item.id,
  field_notes.id,
  'Check HVAC system',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"monthly","interval":1}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Notes'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_notes
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_notes.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_notes.id
  );
-- Daily: Take out trash
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_name.id,
  'Take out trash',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"daily","interval":1}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Chore Name'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_name
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_name.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_name.id
  )
UNION ALL
SELECT item.id,
  field_notes.id,
  'Kitchen and bathroom bins',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"daily","interval":1}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Notes'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_notes
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_notes.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_notes.id
  );
-- Quarterly: Deep clean garage
INSERT INTO field_values (item_id, field_id, value, created_at)
SELECT item.id,
  field_name.id,
  'Deep clean garage',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"monthly","interval":3}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Chore Name'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_name
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_name.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_name.id
  )
UNION ALL
SELECT item.id,
  field_notes.id,
  'Organize tools and storage',
  CURRENT_TIMESTAMP
FROM categories cat
  CROSS JOIN (
    SELECT id
    FROM items
    WHERE category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
      AND recurring_config = '{"frequency":"monthly","interval":3}'
    LIMIT 1
  ) item
  CROSS JOIN (
    SELECT id
    FROM fields
    WHERE name = 'Notes'
      AND category_id = (
        SELECT id
        FROM categories
        WHERE name = 'Household Chores'
          AND user_id = (
            SELECT id
            FROM users
            WHERE username = 'tim'
            LIMIT 1
          )
        LIMIT 1
      )
    LIMIT 1
  ) field_notes
WHERE cat.name = 'Household Chores'
  AND cat.user_id = (
    SELECT id
    FROM users
    WHERE username = 'tim'
    LIMIT 1
  )
  AND item.id IS NOT NULL
  AND field_notes.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM field_values fv
    WHERE fv.item_id = item.id
      AND fv.field_id = field_notes.id
  );