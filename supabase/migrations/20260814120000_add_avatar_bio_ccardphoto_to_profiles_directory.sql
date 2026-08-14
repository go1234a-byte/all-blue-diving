-- profiles_directory 뷰(diverProfiles/instructorProfiles 로딩에 쓰임)에 avatar_url/bio/
-- c_card_photo_path 컬럼이 처음부터 빠져 있었다. profiles 테이블에는 정상 저장되는데,
-- 새로고침할 때마다 이 뷰를 통해 다시 읽어오는 화면(마이페이지 등)에서는 이 세 값이 항상
-- 빈 값으로 보여서 "프로필 사진/자기소개/자격증 사진이 저장 안 되고 초기화된다"로 느껴졌다.
-- avatar_url/bio는 공개 프로필·채팅 등에서 이미 노출되는 값이라 마스킹 없이 추가하고,
-- c_card_photo_path는 다른 민감 서류 경로들과 동일하게 is_profile_staff_for로 마스킹한다.
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
