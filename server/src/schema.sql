-- Bradbury Balance App schema
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period INT NOT NULL CHECK (period BETWEEN 1 AND 12),
  device_type TEXT NOT NULL CHECK (device_type IN ('iphone','android','other')),
  timeframe TEXT NOT NULL DEFAULT '7dayavg' CHECK (timeframe IN ('7dayavg','yesterday')),
  screen_minutes INT NOT NULL CHECK (screen_minutes BETWEEN 0 AND 1440),

  pickups INT NULL CHECK (pickups BETWEEN 0 AND 2000),
  notifications INT NULL CHECK (notifications BETWEEN 0 AND 20000),

  social_minutes INT NULL CHECK (social_minutes BETWEEN 0 AND 1440),
  entertainment_minutes INT NULL CHECK (entertainment_minutes BETWEEN 0 AND 1440),
  games_minutes INT NULL CHECK (games_minutes BETWEEN 0 AND 1440),
  productivity_minutes INT NULL CHECK (productivity_minutes BETWEEN 0 AND 1440),
  communication_minutes INT NULL CHECK (communication_minutes BETWEEN 0 AND 1440),

  top_apps JSONB NULL,

  reflection_text TEXT NULL,

  created_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_submissions_created_date ON submissions(created_date);
CREATE INDEX IF NOT EXISTS idx_submissions_period ON submissions(period);
