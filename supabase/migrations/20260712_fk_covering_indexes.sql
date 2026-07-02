-- Add covering indexes for foreign keys that lack one.
-- Supabase performance advisor: `unindexed_foreign_keys` (38 findings).
--
-- Catalog-driven on purpose: it reads the actual FK columns from the system
-- catalogs and only creates an index where no btree index already covers the FK
-- (i.e. the FK columns are a leading prefix of an existing index). This:
--   * handles every FK regardless of constraint naming (e.g. the custom-named
--     stock_documents_audit_fk), without guessing columns from the name;
--   * is idempotent (CREATE INDEX IF NOT EXISTS + the coverage check), so it is
--     safe to re-run.
--
-- Note: CREATE INDEX (non-concurrent) briefly locks each table while building.
-- That is fine for this DB's data sizes; if any table later grows large, build
-- that one with CREATE INDEX CONCURRENTLY outside a transaction instead.
--
-- After applying, re-run the performance advisor to confirm
-- `unindexed_foreign_keys` drops to 0.

BEGIN;

DO $$
DECLARE
  fk   record;
  cols text;
  idx  text;
BEGIN
  FOR fk IN
    SELECT
      con.conname,
      con.conrelid,
      con.conrelid::regclass::text AS tbl,
      con.conkey
    FROM pg_constraint con
    JOIN pg_class c     ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE con.contype = 'f'
      AND n.nspname = 'public'
      AND NOT EXISTS (
        -- an existing btree index "covers" the FK when the FK columns are a
        -- leading prefix of the index key columns, in order
        SELECT 1
        FROM pg_index i
        JOIN pg_class ic ON ic.oid = i.indexrelid
        JOIN pg_am am    ON am.oid = ic.relam
        WHERE i.indrelid = con.conrelid
          AND i.indisvalid
          AND i.indpred IS NULL        -- not a partial index
          AND am.amname = 'btree'
          AND (string_to_array(i.indkey::text, ' ')::smallint[])[
                1:cardinality(con.conkey)
              ] = con.conkey
      )
  LOOP
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY k.ord)
      INTO cols
      FROM unnest(fk.conkey) WITH ORDINALITY AS k(attnum, ord)
      JOIN pg_attribute a
        ON a.attrelid = fk.conrelid
       AND a.attnum   = k.attnum;

    idx := left('idx_' || fk.conname, 63);

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %s (%s)',
      idx, fk.tbl, cols
    );
    RAISE NOTICE 'covering index % on % (%)', idx, fk.tbl, cols;
  END LOOP;
END $$;

COMMIT;
