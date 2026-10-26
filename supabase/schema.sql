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
  stop_id TEXT, -- היעד (route stop) שהפעילות שייכת אליו
  activity_date DATE, -- רק כשהיום נקבע במפורש
  time_slot TEXT, -- e.g. "09:30", "בוקר", "ערב"
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  category TEXT DEFAULT 'attraction', -- sightseeing, food, transport, relaxation, nature, shopping
  cost NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'planned', -- planned, completed, cancelled
  order_index INTEGER DEFAULT 0,
  lat DOUBLE PRECISION, -- מיקום על המפה (אופציונלי)
  lng DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- למי שכבר יצר את הטבלאות: מוסיף מיקום למפה לפעילויות
ALTER TABLE activities ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- למי שכבר יצר את הטבלאות: פעילויות שייכות ליעד, והתאריך אופציונלי
ALTER TABLE activities ADD COLUMN IF NOT EXISTS stop_id TEXT;
ALTER TABLE activities ALTER COLUMN activity_date DROP NOT NULL;

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

-- 6.5 משימות (עם תלויות בין משימות)
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  task_group TEXT NOT NULL,
  assigned_to TEXT DEFAULT 'שנינו', -- הוא, היא, שנינו
  due_date DATE,
  notes TEXT,
  is_done BOOLEAN DEFAULT false,
  depends_on JSONB DEFAULT '[]'::jsonb, -- מערך של מזהי משימות שחייבות להסתיים קודם
  phase TEXT DEFAULT 'before', -- before = לסגור לפני הטיול, during = לסגור במהלך הטיול
  urgent BOOLEAN DEFAULT false, -- לסגור בהקדם
  person TEXT, -- האדם שהמשימה קשורה אליו
  linked_date DATE, -- התאריך שהמשימה קשורה אליו
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- למי שכבר יצר את הטבלאות: קישור משימה לאדם ולתאריך, ויעדים שלא צריכים מלון
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS person TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS linked_date DATE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS no_hotel_stops JSONB DEFAULT '[]'::jsonb;

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
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for trips" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for flights" ON flights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for lodgings" ON lodgings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for activities" ON activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for budget_items" ON budget_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for packing_items" ON packing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write for chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- הכנסת נתוני הטיול המלא: וייטנאם והפיליפינים (17.11.2026 - 17.01.2027)
INSERT INTO trips (id, title, destination, start_date, end_date, notes, share_code)
VALUES (
  'trip-vietnam-philippines-2026',
  'המסע הגדול: וייטנאם 🇻🇳 והפיליפינים 🇵🇭',
  'וייטנאם (17.11 - 19.12) & הפיליפינים (20.12 - 17.01)',
  '2026-11-17',
  '2027-01-17',
  'טיול חלומי של חודשיים שלמים (17.11.2026 עד 17.01.2027 - 62 ימים)! חלק א׳: וייטנאם (סאפה, הא ג׳יאנג, מאי צ׳או, האנוי, קאו בנג, האלונג, טאם קוק, הויאן). חלק ב׳: הפיליפינים - איים טרופיים, חופים, שוניות, לגונות וסילבסטר 2027!',
  'VNPH2627'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  destination = EXCLUDED.destination,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  notes = EXCLUDED.notes;

INSERT INTO flights (id, trip_id, airline, flight_number, departure_airport, arrival_airport, departure_time, arrival_time, confirmation_code, price, notes)
VALUES
('flight-vn-1', 'trip-vietnam-philippines-2026', 'טיסה הלוך לוייטנאם', 'VN-TLV', 'נתב״ג טרמינל 3 (TLV)', 'האנוי נוי ביי (HAN)', '2026-11-17 18:00:00+00', '2026-11-18 10:30:00+00', 'VN7892X', 3800, 'המראה ב-18:00 כפי שמופיע בלוח השנה'),
('flight-ph-2', 'trip-vietnam-philippines-2026', 'טיסת מעבר: וייטנאם ➔ פיליפינים', 'PR592', 'דה נאנג / האנוי', 'מנילה / סבו (MNL/CEB)', '2026-12-20 10:00:00+00', '2026-12-20 14:30:00+00', 'PR8823K', 1200, 'טיסת מעבר בין וייטנאם לפיליפינים'),
('flight-ph-3', 'trip-vietnam-philippines-2026', 'טיסה חזרה לישראל', 'PH-TLV', 'מנילה (MNL)', 'נתב״ג טרמינל 3 (TLV)', '2027-01-17 19:30:00+00', '2027-01-18 05:00:00+00', 'HOMETLV27', 3900, 'טיסה חזור בסיום חודשיים מושלמים!')
ON CONFLICT (id) DO NOTHING;


