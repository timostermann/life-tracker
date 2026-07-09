CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK(template_type IN ('task', 'chore', 'habit')),
    icon TEXT,
    color TEXT,
    is_private INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_template_type ON categories(template_type);
CREATE INDEX IF NOT EXISTS idx_categories_is_private ON categories(is_private);
CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK(
        field_type IN ('text', 'number', 'date', 'boolean', 'select')
    ),
    options TEXT,
    field_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_fields_category_id ON fields(category_id);
CREATE INDEX IF NOT EXISTS idx_fields_order ON fields(category_id, field_order);
CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_to_user_id INTEGER,
    priority TEXT CHECK(priority IN ('urgent', 'high', 'medium', 'low')),
    deadline DATETIME,
    time_estimate INTEGER,
    is_archived INTEGER NOT NULL DEFAULT 0,
    completed_at DATETIME,
    recurring_config TEXT,
    next_show_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE
    SET NULL
);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_assigned_to ON items(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_items_priority ON items(priority);
CREATE INDEX IF NOT EXISTS idx_items_deadline ON items(deadline);
CREATE INDEX IF NOT EXISTS idx_items_is_archived ON items(is_archived);
CREATE INDEX IF NOT EXISTS idx_items_next_show_date ON items(next_show_date);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE TABLE IF NOT EXISTS field_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    field_id INTEGER NOT NULL,
    value TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE,
    UNIQUE(item_id, field_id)
);
CREATE INDEX IF NOT EXISTS idx_field_values_item_id ON field_values(item_id);
CREATE INDEX IF NOT EXISTS idx_field_values_field_id ON field_values(field_id);
CREATE TABLE IF NOT EXISTS habit_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    logged_date DATE NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('done', 'skipped', 'failed')),
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE(item_id, logged_date)
);
CREATE INDEX IF NOT EXISTS idx_habit_entries_item_id ON habit_entries(item_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_date ON habit_entries(logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_entries_item_date ON habit_entries(item_id, logged_date);
CREATE TABLE IF NOT EXISTS shared_access (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    shared_with_user_id INTEGER NOT NULL,
    permission TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(category_id, shared_with_user_id)
);
CREATE INDEX IF NOT EXISTS idx_shared_access_category_id ON shared_access(category_id);
CREATE INDEX IF NOT EXISTS idx_shared_access_user_id ON shared_access(shared_with_user_id);
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK(template_type IN ('task', 'chore', 'habit')),
    description TEXT,
    icon TEXT,
    category_config TEXT NOT NULL,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(template_type);
CREATE INDEX IF NOT EXISTS idx_templates_is_system ON templates(is_system);