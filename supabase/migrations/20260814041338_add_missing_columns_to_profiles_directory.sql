create or replace view public.profiles_directory as
 select id,
    role,
    name,
    status,
    created_at,
        CASE
            WHEN is_tour_companion_of(id::text) THEN birth_date
            ELSE NULL::date
        END AS birth_date,
        CASE
            WHEN is_tour_companion_of(id::text) THEN c_card_agency
            ELSE NULL::text
        END AS c_card_agency,
        CASE
            WHEN is_tour_companion_of(id::text) THEN log_count
            ELSE NULL::integer
        END AS log_count,
        CASE
            WHEN is_profile_staff_for(id::text) THEN phone
            ELSE NULL::text
        END AS phone,
        CASE
            WHEN is_profile_staff_for(id::text) THEN gender
            ELSE NULL::text
        END AS gender,
        CASE
            WHEN is_profile_staff_for(id::text) THEN snoring
            ELSE NULL::boolean
        END AS snoring,
        CASE
            WHEN is_profile_staff_for(id::text) THEN smoking
            ELSE NULL::boolean
        END AS smoking,
        CASE
            WHEN is_profile_staff_for(id::text) THEN c_card_number
            ELSE NULL::text
        END AS c_card_number,
        CASE
            WHEN is_profile_staff_for(id::text) THEN emergency_contact_name
            ELSE NULL::text
        END AS emergency_contact_name,
        CASE
            WHEN is_profile_staff_for(id::text) THEN emergency_contact_phone
            ELSE NULL::text
        END AS emergency_contact_phone,
        CASE
            WHEN is_profile_staff_for(id::text) THEN insurance_info
            ELSE NULL::text
        END AS insurance_info,
        CASE
            WHEN is_profile_staff_for(id::text) THEN bank_name
            ELSE NULL::text
        END AS bank_name,
        CASE
            WHEN is_profile_staff_for(id::text) THEN account_holder
            ELSE NULL::text
        END AS account_holder,
        CASE
            WHEN is_profile_staff_for(id::text) THEN account_number
            ELSE NULL::text
        END AS account_number,
        CASE
            WHEN is_profile_staff_for(id::text) THEN bankbook_file_name
            ELSE NULL::text
        END AS bankbook_file_name,
        CASE
            WHEN is_profile_staff_for(id::text) THEN bankbook_path
            ELSE NULL::text
        END AS bankbook_path,
        CASE
            WHEN is_profile_staff_for(id::text) THEN id_document_path
            ELSE NULL::text
        END AS id_document_path,
    avatar_url,
    bio,
        CASE
            WHEN is_profile_staff_for(id::text) THEN c_card_photo_path
            ELSE NULL::text
        END AS c_card_photo_path
   FROM profiles p
  WHERE deleted_at IS NULL;
