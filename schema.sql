-- =============================================
-- STORE MANAGEMENT SYSTEM - PostgreSQL Schema
-- Database: Supabase PostgreSQL
-- =============================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  prefix VARCHAR(10) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff / Helpers Table
CREATE TABLE IF NOT EXISTS staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Staff', 'Helper', 'Supplier', 'Other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Items (Item Master) Table
CREATE TABLE IF NOT EXISTS items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_code VARCHAR(20) NOT NULL UNIQUE,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) REFERENCES categories(name) ON UPDATE CASCADE,
  unit VARCHAR(50) DEFAULT 'Nos',
  minimum_stock INTEGER DEFAULT 5,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Stock In Table
CREATE TABLE IF NOT EXISTS stock_in (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  item_code VARCHAR(20) REFERENCES items(item_code) ON UPDATE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  source VARCHAR(150) DEFAULT 'Supplier',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Stock Out Table
CREATE TABLE IF NOT EXISTS stock_out (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  time TIME NOT NULL,
  item_code VARCHAR(20) REFERENCES items(item_code) ON UPDATE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  category VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  handover_to VARCHAR(150),
  purpose TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_stock_in_item_code ON stock_in(item_code);
CREATE INDEX IF NOT EXISTS idx_stock_in_date ON stock_in(date);
CREATE INDEX IF NOT EXISTS idx_stock_out_item_code ON stock_out(item_code);
CREATE INDEX IF NOT EXISTS idx_stock_out_date ON stock_out(date);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- =============================================
-- VIEW: Current Stock Summary (computed)
-- =============================================
CREATE OR REPLACE VIEW current_stock AS
SELECT
  i.id,
  i.item_code,
  i.item_name,
  i.category,
  i.unit,
  i.minimum_stock,
  COALESCE(SUM(si.quantity), 0) AS total_in,
  COALESCE(SUM(so.quantity), 0) AS total_out,
  COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0) AS current_qty,
  CASE
    WHEN (COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0)) = 0 THEN 'Empty'
    WHEN (COALESCE(SUM(si.quantity), 0) - COALESCE(SUM(so.quantity), 0)) <= i.minimum_stock THEN 'Low'
    ELSE 'Good'
  END AS status
FROM items i
LEFT JOIN stock_in si ON si.item_code = i.item_code
LEFT JOIN stock_out so ON so.item_code = i.item_code
GROUP BY i.id, i.item_code, i.item_name, i.category, i.unit, i.minimum_stock;

-- =============================================
-- AUTO-UPDATE updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_in_updated_at BEFORE UPDATE ON stock_in
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_out_updated_at BEFORE UPDATE ON stock_out
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA - Default Categories
-- =============================================
INSERT INTO categories (name, prefix) VALUES
  ('Electronics', 'E'),
  ('Electrical', 'EX'),
  ('Mechanical', 'M'),
  ('Plumbing', 'P'),
  ('Hardware', 'H'),
  ('Tools', 'T')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- SEED DATA - Default Staff
-- =============================================
INSERT INTO staff (name, type) VALUES
  ('Ms. Kaveri Gangurde', 'Staff'),
  ('Mr. Suhas Bachhav', 'Staff'),
  ('Mr. Harshal Gawali', 'Staff'),
  ('Ramesh', 'Helper'),
  ('Supplier', 'Supplier')
ON CONFLICT DO NOTHING;
