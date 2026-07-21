-- Upgrade five service cards from branded SVG placeholders to the clinic's
-- real photos (public/assets/images/services/*), now that the photo set is in
-- the repo. Only services with an HONEST photo match are repointed; the rest
-- keep the branded placeholder:
--   - dental-cleaning.jpg / teeth-whitening.jpg are visibly AI-generated
--     (warped text) — excluded on brand-quality grounds;
--   - dental-implants.jpg is one 3D render that would duplicate across the two
--     adjacent implant cards — both keep their differentiated SVGs;
--   - no honest match exists for extractions, crowns, veneer, cavity 2+,
--     ceramic braces.
--
-- Same contract as 20260720_repoint_placeholder_images.sql: idempotent and
-- guarded — a row is touched ONLY while it still carries a placeholder
-- (/services/*.svg), is NULL, or points at the dead legacy host. A real photo
-- set by an admin later is never clobbered, and re-running is a no-op.
--
-- Coupling: name_en literals mirror scripts/003_seed_data.sql; the referenced
-- asset files are pinned by src/test/placeholder-images.test.ts (existence +
-- key-in-seed tripwires cover this migration too).

do $$
declare
  m record;
begin
  for m in
    select *
    from (
      values
        ('Dental Consultation', '/assets/images/services/treatment.jpg'),
        ('Cavity Treatment (1 surface)', '/assets/images/services/therapy.jpg'),
        ('Pulpitis Treatment', '/assets/images/services/treatment-2.jpg'),
        ('Metal Braces', '/assets/images/services/orthodontics.jpg'),
        ('Clear Aligners', '/assets/images/services/aligners.jpg')
    ) as t(name_en, photo)
  loop
    update public.services
       set image_url = m.photo,
           updated_at = now()
     where name_en = m.name_en
       and (
         image_url is null
         or image_url like '/services/%.svg'
         or image_url ilike '%dentalstory.com.ua%'
       );
  end loop;
end $$;
