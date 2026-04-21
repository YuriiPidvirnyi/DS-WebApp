-- RPC: get_recall_candidates
-- Returns patients/guests whose last completed appointment was >= threshold_date
-- and who have NO upcoming confirmed or pending appointment.
-- Called by /api/cron/recall daily.

CREATE OR REPLACE FUNCTION get_recall_candidates(threshold_date date)
RETURNS TABLE (
  patient_id   uuid,
  guest_email  text,
  patient_name text,
  last_visit_date date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH last_visits AS (
    SELECT
      a.patient_id,
      a.guest_email,
      COALESCE(a.patient_name, a.guest_name) AS patient_name,
      MAX(a.appointment_date::date)           AS last_visit_date
    FROM appointments a
    WHERE a.status = 'completed'
      AND (a.patient_id IS NOT NULL OR a.guest_email IS NOT NULL)
    GROUP BY a.patient_id, a.guest_email, COALESCE(a.patient_name, a.guest_name)
  ),
  upcoming AS (
    SELECT DISTINCT
      a.patient_id,
      a.guest_email
    FROM appointments a
    WHERE a.status IN ('pending', 'confirmed')
      AND a.appointment_date::date >= CURRENT_DATE
  )
  SELECT
    lv.patient_id,
    lv.guest_email,
    lv.patient_name,
    lv.last_visit_date
  FROM last_visits lv
  LEFT JOIN upcoming u
    ON (lv.patient_id IS NOT NULL AND lv.patient_id = u.patient_id)
    OR (lv.guest_email IS NOT NULL AND lv.guest_email = u.guest_email)
  WHERE u.patient_id IS NULL
    AND u.guest_email IS NULL
    AND lv.last_visit_date <= threshold_date
$$;

-- Grant execute to service role only (called from cron via service key)
REVOKE ALL ON FUNCTION get_recall_candidates(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_recall_candidates(date) TO service_role;
