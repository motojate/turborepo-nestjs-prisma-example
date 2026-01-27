-- =========================================================
-- 1) Table: SIGNAL_SERVER
-- =========================================================
CREATE TABLE IF NOT EXISTS "SIGNAL_SERVER" (
  "id" BIGSERIAL NOT NULL,
  "signal_key" VARCHAR(10) NOT NULL,
  "signal_url" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "SIGNAL_SERVER_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SIGNAL_SERVER_signal_key_key" ON "SIGNAL_SERVER" ("signal_key");
CREATE UNIQUE INDEX IF NOT EXISTS "SIGNAL_SERVER_signal_url_key" ON "SIGNAL_SERVER" ("signal_url");
CREATE INDEX IF NOT EXISTS "SIGNAL_SERVER_key_idx" ON "SIGNAL_SERVER" ("signal_key");


-- =========================================================
-- 2) Table: RENDERER
-- =========================================================
CREATE TABLE IF NOT EXISTS "RENDERER" (
  "id" BIGSERIAL NOT NULL,
  "renderer_id" TEXT NOT NULL,
  "renderer_name" TEXT,
  "renderer_group" TEXT,
  "renderer_address" TEXT NOT NULL,
  "renderer_port" INTEGER NOT NULL DEFAULT 0,
  "start_time" TEXT,
  "signal_key" VARCHAR(10) NOT NULL,
  "max_users" INTEGER NOT NULL DEFAULT 0,
  "last_tick_time" TIMESTAMPTZ(6),
  "last_tock_time" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "RENDERER_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RENDERER" 
  DROP CONSTRAINT IF EXISTS "RENDERER_signal_key_fkey";
ALTER TABLE "RENDERER" 
  ADD CONSTRAINT "RENDERER_signal_key_fkey" 
  FOREIGN KEY ("signal_key") REFERENCES "SIGNAL_SERVER"("signal_key") ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS "RENDERER_renderer_id_signal_key_uk"
  ON "RENDERER" ("renderer_id", "signal_key");

CREATE INDEX IF NOT EXISTS "RENDERER_signal_key_idx"
  ON "RENDERER" ("signal_key");

CREATE INDEX IF NOT EXISTS "RENDERER_signal_key_group_idx"
  ON "RENDERER" ("signal_key", "renderer_group");

-- [Trigger] updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "trg_renderer_set_updated_at" ON "RENDERER";
CREATE TRIGGER "trg_renderer_set_updated_at"
BEFORE UPDATE ON "RENDERER"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================================================
-- 3) Table: SIGNAL_SERVER_OFF_HISTORY
-- =========================================================
CREATE TABLE IF NOT EXISTS "SIGNAL_SERVER_OFF_HISTORY" (
  "id" BIGSERIAL NOT NULL,
  "signal_key" VARCHAR(10) NOT NULL,
  "signal_url" TEXT NOT NULL,
  "off_observed_at" TIMESTAMPTZ(6) NOT NULL,
  
  CONSTRAINT "SIGNAL_SERVER_OFF_HISTORY_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SSOH_signal_key_off_observed_idx"
  ON "SIGNAL_SERVER_OFF_HISTORY" ("signal_key", "off_observed_at" DESC);


-- =========================================================
-- 4) Table: RENDERER_OFF_HISTORY
-- =========================================================
CREATE TABLE IF NOT EXISTS "RENDERER_OFF_HISTORY" (
  "id" BIGSERIAL NOT NULL,
  "renderer_id" TEXT NOT NULL,
  "renderer_name" TEXT,
  "renderer_group" TEXT,
  "renderer_address" TEXT NOT NULL,
  "start_time" TEXT,
  "signal_key" VARCHAR(10) NOT NULL,
  "signal_url" TEXT NOT NULL,
  "off_observed_at" TIMESTAMPTZ(6) NOT NULL,
  
  CONSTRAINT "RENDERER_OFF_HISTORY_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ROH_renderer_off_observed_idx"
  ON "RENDERER_OFF_HISTORY" ("renderer_id", "off_observed_at" DESC);


-- =========================================================
-- 5) Table: VIEWER_HISTORY (Partitioned)
-- =========================================================
CREATE TABLE IF NOT EXISTS "VIEWER_HISTORY" (
  "id" BIGSERIAL NOT NULL,
  
  "renderer_id" TEXT NOT NULL,
  "renderer_group" TEXT,
  "signal_key" VARCHAR(10) NOT NULL,
  "signal_url" TEXT NOT NULL,
  
  "session_id" TEXT NOT NULL,
  "viewer_id" TEXT NOT NULL,
  "viewer_ip" TEXT NOT NULL,
  "viewer_agent" TEXT,
  "viewer_port" INTEGER,
  "is_internal_user" BOOLEAN NOT NULL,
  
  "project_id" INTEGER NOT NULL,
  "client_id" TEXT NOT NULL,
  "is_host" BOOLEAN NOT NULL,
  
  "started_at" TIMESTAMPTZ(0) NOT NULL,
  "ended_at" TIMESTAMPTZ(0),
  "duration_sec" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "VIEWER_HISTORY_pkey" PRIMARY KEY ("id", "started_at"),
  
  CONSTRAINT "VIEWER_HISTORY_port_chk" CHECK ("viewer_port" IS NULL OR ("viewer_port" BETWEEN 0 AND 65535)),
  CONSTRAINT "VIEWER_HISTORY_duration_chk" CHECK ("duration_sec" >= 0),
  CONSTRAINT "VIEWER_HISTORY_time_order_chk" CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at")
) PARTITION BY RANGE ("started_at");

COMMENT ON TABLE "VIEWER_HISTORY" IS 'ViewerHistory: Weekly Range Partitioning';

CREATE UNIQUE INDEX IF NOT EXISTS "VIEWER_HISTORY_session_viewer_uk"
  ON "VIEWER_HISTORY" ("session_id", "viewer_id", "started_at");

CREATE INDEX IF NOT EXISTS "VIEWER_HISTORY_renderer_signal_started_idx"
  ON "VIEWER_HISTORY" ("renderer_id", "signal_key", "started_at" DESC);

CREATE INDEX IF NOT EXISTS "VIEWER_HISTORY_group_signal_started_idx"
  ON "VIEWER_HISTORY" ("renderer_group", "signal_key", "started_at" DESC);

CREATE INDEX IF NOT EXISTS "VIEWER_HISTORY_started_at_idx"
  ON "VIEWER_HISTORY" ("started_at" DESC);


-- =========================================================
-- 6) & 7) Function & Partition Creation
-- =========================================================
CREATE OR REPLACE FUNCTION ensure_viewer_history_week_partitions(
  p_base_ts TIMESTAMPTZ,
  p_weeks_ahead INT DEFAULT 12
) RETURNS VOID AS $$
DECLARE
  i INT;
  week_start TIMESTAMPTZ;
  week_end   TIMESTAMPTZ;
  part_name  TEXT;
BEGIN
  IF p_weeks_ahead < 0 THEN
    RAISE EXCEPTION 'p_weeks_ahead must be >= 0';
  END IF;

  FOR i IN 0..p_weeks_ahead LOOP
    week_start := date_trunc('week', p_base_ts) + (i * INTERVAL '7 days');
    week_end   := week_start + INTERVAL '7 days';
    part_name  := 'VIEWER_HISTORY_' || to_char(week_start, 'YYYY_MM_DD');

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF "VIEWER_HISTORY"
       FOR VALUES FROM (%L) TO (%L);',
      part_name, week_start, week_end
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT ensure_viewer_history_week_partitions(NOW(), 12);


-- =========================================================
-- 8) Extension: TimescaleDB 활성화
-- =========================================================
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- =========================================================
-- 9) Table: RENDERER_HISTORY (Raw Data - Hypertable)
-- =========================================================
CREATE TABLE IF NOT EXISTS "RENDERER_HISTORY" (
  "time" TIMESTAMPTZ(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "renderer_id" TEXT NOT NULL,
  
  "signal_key" VARCHAR(10) NOT NULL,
  "signal_url" TEXT NOT NULL,
  "renderer_name" TEXT,
  "renderer_group" TEXT,
  
  "viewer_count" INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT "RENDERER_HISTORY_pkey" PRIMARY KEY ("time", "renderer_id", "signal_key")
);

SELECT create_hypertable('"RENDERER_HISTORY"', 'time', if_not_exists => TRUE);

CREATE INDEX IF NOT EXISTS "RENDERER_HISTORY_signal_key_time_idx" 
  ON "RENDERER_HISTORY" ("signal_key", "time" DESC);

CREATE INDEX IF NOT EXISTS "RENDERER_HISTORY_group_time_idx" 
  ON "RENDERER_HISTORY" ("renderer_group", "time" DESC);

SELECT add_retention_policy('"RENDERER_HISTORY"', INTERVAL '1 month', if_not_exists => TRUE);


-- =========================================================
-- 10) Compression Policy
-- =========================================================
ALTER TABLE "RENDERER_HISTORY" SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'renderer_id, signal_key',
  timescaledb.compress_orderby = 'time DESC'
);

SELECT add_compression_policy('"RENDERER_HISTORY"', INTERVAL '3 days', if_not_exists => TRUE);


-- =========================================================
-- 11) View: RENDERER_STATS_MINUTELY (분당 통계)
-- =========================================================
DROP MATERIALIZED VIEW IF EXISTS "RENDERER_STATS_MINUTELY" CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS "RENDERER_STATS_MINUTELY"
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 minute', time, 'Asia/Seoul') AS bucket,
  signal_key,
  renderer_id,
  renderer_group,
  AVG(viewer_count) AS avg_ccu,
  MAX(viewer_count) AS max_ccu,
  MIN(viewer_count) AS min_ccu,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY viewer_count) AS median_ccu,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY viewer_count) AS p95_ccu,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY viewer_count) AS p99_ccu
FROM "RENDERER_HISTORY"
GROUP BY bucket, signal_key, renderer_id, renderer_group
WITH NO DATA;

SELECT add_continuous_aggregate_policy('"RENDERER_STATS_MINUTELY"',
  start_offset      => INTERVAL '10 minutes',
  end_offset        => INTERVAL '1 minute',
  schedule_interval => INTERVAL '3 minutes', 
  if_not_exists => TRUE
);
  
SELECT add_retention_policy('"RENDERER_STATS_MINUTELY"', INTERVAL '6 months', if_not_exists => TRUE);

-- [수정] UNIQUE 제거 -> 일반 INDEX로 변경
CREATE INDEX IF NOT EXISTS "RENDERER_STATS_MINUTELY_bucket_signal_id_uk"
  ON "RENDERER_STATS_MINUTELY" ("bucket", "signal_key", "renderer_id");

CREATE INDEX IF NOT EXISTS "RENDERER_STATS_MINUTELY_signal_group_bucket_idx"
  ON "RENDERER_STATS_MINUTELY" ("signal_key", "renderer_group", "bucket" DESC);


-- =========================================================
-- 12) View: RENDERER_STATS_HOURLY (시간당 통계)
-- =========================================================
DROP MATERIALIZED VIEW IF EXISTS "RENDERER_STATS_HOURLY" CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS "RENDERER_STATS_HOURLY"
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time, 'Asia/Seoul') AS bucket,
  signal_key,
  renderer_id,
  renderer_group,
  AVG(viewer_count) AS avg_ccu,
  MAX(viewer_count) AS max_ccu,
  MIN(viewer_count) AS min_ccu,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY viewer_count) AS median_ccu,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY viewer_count) AS p95_ccu,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY viewer_count) AS p99_ccu
FROM "RENDERER_HISTORY"
GROUP BY bucket, signal_key, renderer_id, renderer_group
WITH NO DATA;

SELECT add_continuous_aggregate_policy('"RENDERER_STATS_HOURLY"',
  start_offset => INTERVAL '3 hours 30 minutes',
  end_offset => INTERVAL '30 minutes',
  schedule_interval => INTERVAL '1 hour',
  initial_start =>
    (
      (date_trunc('hour', now() AT TIME ZONE 'Asia/Seoul') + INTERVAL '30 minutes')
      + CASE
          WHEN (now() AT TIME ZONE 'Asia/Seoul')
               >= (date_trunc('hour', now() AT TIME ZONE 'Asia/Seoul') + INTERVAL '30 minutes')
          THEN INTERVAL '1 hour'
          ELSE INTERVAL '0'
        END
    ) AT TIME ZONE 'Asia/Seoul',
  if_not_exists => TRUE
);

-- [수정] UNIQUE 제거
CREATE INDEX IF NOT EXISTS "RENDERER_STATS_HOURLY_bucket_signal_id_uk"
  ON "RENDERER_STATS_HOURLY" ("bucket", "signal_key", "renderer_id");

CREATE INDEX IF NOT EXISTS "RENDERER_STATS_HOURLY_signal_group_bucket_idx"
  ON "RENDERER_STATS_HOURLY" ("signal_key", "renderer_group", "bucket" DESC);


-- =========================================================
-- 13) View: RENDERER_STATS_DAILY (일간 통계)
-- =========================================================
DROP MATERIALIZED VIEW IF EXISTS "RENDERER_STATS_DAILY" CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS "RENDERER_STATS_DAILY"
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', time, 'Asia/Seoul') AS bucket,
  signal_key,
  renderer_id,
  renderer_group,
  AVG(viewer_count) AS avg_ccu,
  MAX(viewer_count) AS max_ccu,
  MIN(viewer_count) AS min_ccu,
  percentile_cont(0.5) WITHIN GROUP (ORDER BY viewer_count) AS median_ccu,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY viewer_count) AS p95_ccu,
  percentile_cont(0.99) WITHIN GROUP (ORDER BY viewer_count) AS p99_ccu
FROM "RENDERER_HISTORY"
GROUP BY bucket, signal_key, renderer_id, renderer_group
WITH NO DATA;

SELECT add_continuous_aggregate_policy('"RENDERER_STATS_DAILY"',
  start_offset => INTERVAL '3 days 30 minutes',
  end_offset   => INTERVAL '30 minutes',
  schedule_interval => INTERVAL '1 day',
  initial_start =>
    (
      (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') + INTERVAL '30 minutes')
      + CASE
          WHEN (now() AT TIME ZONE 'Asia/Seoul')
               >= (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') + INTERVAL '30 minutes')
          THEN INTERVAL '1 day'
          ELSE INTERVAL '0'
        END
    ) AT TIME ZONE 'Asia/Seoul',
  if_not_exists => TRUE
);

-- [수정] UNIQUE 제거
CREATE INDEX IF NOT EXISTS "RENDERER_STATS_DAILY_bucket_signal_id_uk"
  ON "RENDERER_STATS_DAILY" ("bucket", "signal_key", "renderer_id");

CREATE INDEX IF NOT EXISTS "RENDERER_STATS_DAILY_signal_group_bucket_idx"
  ON "RENDERER_STATS_DAILY" ("signal_key", "renderer_group", "bucket" DESC);