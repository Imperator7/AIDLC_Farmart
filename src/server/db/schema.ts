/**
 * SQLite schema for the catalog (openapi.yaml › Catalog, Content, Search).
 * Money is stored in integer cents and converted to decimal dollars at the API edge.
 * Bump SCHEMA_VERSION when this changes; `openDb` then refuses an older database until `npm run db:reset` rebuilds it.
 */
export const SCHEMA_VERSION = 1;

export const SCHEMA = /* sql */ `
CREATE TABLE IF NOT EXISTS categories (
  slug      TEXT PRIMARY KEY,
  name      TEXT NOT NULL UNIQUE,
  image     TEXT NOT NULL,
  position  INTEGER NOT NULL,
  featured  INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1))
);

CREATE TABLE IF NOT EXISTS products (
  id               TEXT PRIMARY KEY,
  brand            TEXT NOT NULL,
  name             TEXT NOT NULL,
  category_slug    TEXT NOT NULL REFERENCES categories (slug),
  unit             TEXT NOT NULL,
  price_cents      INTEGER NOT NULL CHECK (price_cents > 0),
  old_price_cents  INTEGER CHECK (old_price_cents IS NULL OR old_price_cents > price_cents),
  rating           REAL NOT NULL CHECK (rating BETWEEN 0 AND 5),
  reviews          INTEGER NOT NULL DEFAULT 0,
  image            TEXT NOT NULL,
  stock            INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sold_week        INTEGER NOT NULL DEFAULT 0,
  sold_month       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS products_category ON products (category_slug);
CREATE INDEX IF NOT EXISTS products_created ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS products_sold_week ON products (sold_week DESC);

CREATE TABLE IF NOT EXISTS product_details (
  product_id   TEXT PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  origin       TEXT NOT NULL,
  storage      TEXT NOT NULL,
  highlights   TEXT NOT NULL DEFAULT '[]' -- JSON array of strings
);

-- Today's Top Saver deals. The window resets at midnight in the store's time zone.
CREATE TABLE IF NOT EXISTS deals (
  product_id  TEXT PRIMARY KEY REFERENCES products (id) ON DELETE CASCADE,
  sold        INTEGER NOT NULL DEFAULT 0 CHECK (sold >= 0)
);

CREATE TABLE IF NOT EXISTS banners (
  id         TEXT PRIMARY KEY,
  placement  TEXT NOT NULL CHECK (placement IN ('hero', 'hero-side', 'promo', 'brand')),
  eyebrow    TEXT,
  title      TEXT NOT NULL,
  subtitle   TEXT,
  brand      TEXT,
  image      TEXT NOT NULL,
  image_alt  TEXT NOT NULL,
  href       TEXT NOT NULL,
  cta_label  TEXT,
  position   INTEGER NOT NULL,
  starts_at  TEXT,
  ends_at    TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT NOT NULL
);
`;
