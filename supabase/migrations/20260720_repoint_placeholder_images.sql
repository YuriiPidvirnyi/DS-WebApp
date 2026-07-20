-- Repoint doctor/service imagery onto the branded local placeholders shipped in
-- this change (public/services/*.svg, public/doctors/*.svg) and off the retired
-- legacy image host.
--
-- Why this exists as a migration
-- ------------------------------
-- The clinic's demo doctors and services were originally loaded out-of-band with
-- image URLs on the dead host `dentalstory.com.ua`. Those broken images were
-- repointed to local placeholders via a one-off UPDATE during review — a fix
-- that lived nowhere in the repo. Any environment restored from an older backup,
-- reseeded, or still pointing at the retired host would therefore silently drift
-- back to broken/blank imagery and undo the visible fix. This migration makes the
-- repoint a reproducible, idempotent artifact so the branded placeholders are a
-- first-class part of the schema history instead of manual prod surgery.
--
-- Safety / idempotency
-- --------------------
-- Every UPDATE is guarded to touch a row ONLY when its image is unset (NULL) or
-- still points at the dead host. A real, uploaded photo is never clobbered, and
-- re-running the migration is a no-op. The service/doctor keys (localized name,
-- surname) are stable identifiers already present in the data.

-- ── Services: bind each catalogue entry to its branded placeholder by name ────
do $$
declare
  m record;
begin
  for m in
    select *
    from (
      values
        ('Dental Consultation', '/services/consultation.svg'),
        ('Professional Cleaning', '/services/cleaning.svg'),
        ('Cavity Treatment (1 surface)', '/services/cavity-1surface.svg'),
        ('Cavity Treatment (2+ surfaces)', '/services/cavity-2plus.svg'),
        ('Pulpitis Treatment', '/services/pulpitis.svg'),
        ('Simple Extraction', '/services/extraction-simple.svg'),
        ('Complex Extraction', '/services/extraction-complex.svg'),
        ('Metal-Ceramic Crown', '/services/crown-metalceramic.svg'),
        ('Zirconia Crown', '/services/crown-zirconia.svg'),
        ('Ceramic Veneer', '/services/veneer.svg'),
        ('Dental Implant (MIS)', '/services/implant-mis.svg'),
        ('Dental Implant (Straumann)', '/services/implant-straumann.svg'),
        ('Metal Braces', '/services/braces-metal.svg'),
        ('Ceramic Braces', '/services/braces-ceramic.svg'),
        ('Clear Aligners', '/services/aligners.svg')
    ) as t(name_en, svg)
  loop
    update public.services
       set image_url = m.svg,
           updated_at = now()
     where name_en = m.name_en
       and (image_url is null or image_url ilike '%dentalstory.com.ua%');
  end loop;
end $$;

-- ── Doctors: bind the four demo specialists to their branded avatar by surname ─
do $$
declare
  m record;
begin
  for m in
    select *
    from (
      values
        ('Мельник', '/doctors/andrii-melnyk.svg'),
        ('Бондаренко', '/doctors/dmytro-bondarenko.svg'),
        ('Шевченко', '/doctors/mariia-shevchenko.svg'),
        ('Коваленко', '/doctors/olena-kovalenko.svg')
    ) as t(last_name, svg)
  loop
    update public.doctors
       set photo_url = m.svg,
           updated_at = now()
     where last_name = m.last_name
       and (photo_url is null or photo_url ilike '%dentalstory.com.ua%');
  end loop;
end $$;

-- Any remaining dead-host doctor photo (a surname not covered above) is nulled;
-- the About cards render a branded fallback avatar via <img onError>.
update public.doctors
   set photo_url = null,
       updated_at = now()
 where photo_url ilike '%dentalstory.com.ua%';
