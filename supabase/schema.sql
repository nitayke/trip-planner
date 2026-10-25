-- ==========================================================
-- Travel Planner Schema for Supabase (100% Free PostgreSQL)
-- הרץ סקריפט זה ב-SQL Editor ב-Supabase בחינם
-- ==========================================================

-- 1. טבלת טיולים
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. טבלת טיסות
CREATE TABLE IF NOT EXISTS flights (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  airline TEXT NOT NULL,
  flight_number TEXT NOT NULL,
  departure_airport TEXT NOT NULL,
  arrival_airport TEXT NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE NOT NULL,
  confirmation_code TEXT,
  seat TEXT,
  price NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. טבלת מקומות לינה (מלונות / דירות)
CREATE TABLE IF NOT EXISTS lodgings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'hotel', -- hotel, airbnb, resort
  address TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  confirmation_code TEXT,
  price NUMERIC(10, 2) DEFAULT 0,
  contact_phone TEXT,
  notes TEXT,
  booking_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. טבלת פעילויות יומיות ומסלול
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  time_slot TEXT, -- e.g. "09:30", "בוקר", "ערב"
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT DEFAULT 'attraction', -- sightseeing, food, transport, relaxation, nature, shopping
  cost NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'planned', -- planned, completed, cancelled
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. טבלת מעקב תקציב והוצאות
CREATE TABLE IF NOT EXISTS budget_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- flights, hotels, food, activities, shopping, transit, general
  estimated_cost NUMERIC(10, 2) DEFAULT 0,
  actual_cost NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'ILS', -- ILS, USD, EUR
  paid_by TEXT DEFAULT 'משותף', -- הוא, היא, משותף
  expense_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. טבלת רשימת ציוד ואריזה
CREATE TABLE IF NOT EXISTS packing_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- בגדים, מסמכים וכרטיסים, אלקטרוניקה, רפואי וטואלטיקה, שונות
  assigned_to TEXT DEFAULT 'שנינו', -- הוא, היא, שנינו
  is_packed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. היסטוריית שיחות עם ה-AI
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  actions_performed JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- אפשור גישה (Row Level Security פתוחה או מנוהלת לקריאה/כתיבה חופשית לבעלי המפתח האנונימי)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE lodgings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for trips" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for flights" ON flights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for lodgings" ON lodgings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for budget_items" ON budget_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for packing_items" ON packing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
