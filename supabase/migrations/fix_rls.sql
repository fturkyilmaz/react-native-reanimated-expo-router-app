-- Favorites tablosuna eksik sütunları ekle
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS poster_path TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS release_date TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS vote_average REAL;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS genre_ids TEXT;

-- RLS politikalarını düzelt
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can CRUD own favorites" ON favorites;
CREATE POLICY "Users manage own favorites" ON favorites
    FOR ALL
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);
