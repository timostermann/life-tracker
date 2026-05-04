INSERT INTO templates (
        name,
        template_type,
        description,
        icon,
        category_config,
        is_system
    )
VALUES (
        'Tasks',
        'task',
        'Action items with priorities and optional deadlines',
        '✓',
        '{
      "name": "Tasks",
      "icon": "✓",
      "color": "#3b82f6",
      "fields": [
        { "name": "Title", "field_type": "text", "field_order": 1 },
        { "name": "Description", "field_type": "text", "field_order": 2 }
      ]
    }',
        TRUE
    ),
    (
        'Chores',
        'chore',
        'Recurring household maintenance tasks',
        '🧹',
        '{
      "name": "Chores",
      "icon": "🧹",
      "color": "#10b981",
      "fields": [
        { "name": "Chore Name", "field_type": "text", "field_order": 1 },
        { "name": "Notes", "field_type": "text", "field_order": 2 }
      ]
    }',
        TRUE
    ),
    (
        'Habits',
        'habit',
        'Daily habit tracking with streaks',
        '📈',
        '{
      "name": "Habits",
      "icon": "📈",
      "color": "#8b5cf6",
      "fields": [
        { "name": "Habit Name", "field_type": "text", "field_order": 1 },
        { "name": "Goal", "field_type": "text", "field_order": 2 },
        { "name": "Is Good Habit", "field_type": "boolean", "field_order": 3 }
      ]
    }',
        TRUE
    );