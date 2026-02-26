-- ============================================
-- RLS'yi KAPAT - En Basit Çözüm
-- ============================================

-- Favorites tablosu sütunlarını ekle (eksikse)
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS overview TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS poster_path TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS backdrop_path TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS release_date TEXT;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS vote_average REAL;
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS genre_ids TEXT;

-- RLS'yi kapat
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;

-- Movies tablosu oluştur (yoksa)
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
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- Watchlist tablosu oluştur (yoksa)
CREATE TABLE IF NOT EXISTS watchlist (
    id BIGSERIAL PRIMARY KEY,
    movie_id BIGINT NOT NULL,
    user_id TEXT NOT NULL,
    synced INTEGER DEFAULT 1,
    created_at BIGINT,
    UNIQUE(movie_id, user_id)
);
ALTER TABLE watchlist DISABLE ROW LEVEL SECURITY;

-- Başarı mesajı
SELECT 'RLS disabled. Favorites ready!' as status;
