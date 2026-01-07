-- DCU: form_fields type 제약조건 업데이트
-- 새로운 타입 추가: steps, checkbox, image

-- 기존 제약조건 삭제
ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_type_check;

-- 새 제약조건 추가 (모든 타입 포함)
ALTER TABLE form_fields ADD CONSTRAINT form_fields_type_check
CHECK (type IN ('number', 'text', 'select', 'steps', 'checkbox', 'image'));
