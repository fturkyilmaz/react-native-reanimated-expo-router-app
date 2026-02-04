-- ============================================
-- FAVORITES TABLE SCHEMA & POLICIES
-- ============================================

-- Sütunları ekle (eksikse)
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS poster_path TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS release_date TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS vote_average REAL;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS genre_ids TEXT;

-- RLS'yi yönet
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Eski politikaları sil
DROP POLICY IF EXISTS "Users can CRUD own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;

-- Yeni politika: Kullanıcılar sadece kendi verilerini görebilir/ekleyebilir
CREATE POLICY "Users manage own favorites" ON favorites
    FOR ALL
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================
-- MOVIES TABLE SCHEMA & POLICIES  
-- ============================================

CREATE TABLE IF NOT EXISTS movies (
    id BIGINT PRIMARY KEY,
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    release_date TEXT,
    vote_average REAL,
    genre_ids TEXT,
    updated_at BIGINT
);

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public movie access" ON movies
    FOR SELECT
    USING (true);

-- ============================================
-- WATCHLIST TABLE SCHEMA & POLICIES
-- ============================================

CREATE TABLE IF NOT EXISTS watchlist (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    user_id TEXT NOT NULL,
    synced INTEGER DEFAULT 1,
    created_at BIGINT,
    UNIQUE(movie_id, user_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON watchlist
    FOR ALL
    USING (auth.uid()::text = user_id::text)
    WITH CHECK (auth.uid()::text = user_id::text);

-- ============================================
-- SYNC QUEUE TABLE (opsiyonel)
-- ============================================

CREATE TABLE IF NOT EXISTS sync_queue (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    movie_id BIGINT NOT NULL,
    operation TEXT NOT NULL,
    created_at BIGINT
);
