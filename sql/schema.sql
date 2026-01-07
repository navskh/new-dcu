-- DCU (Daily Check-Up) Database Schema
-- Supabase SQL Editor에서 실행

-- 1. forms 테이블 (폼 정의)
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    theme VARCHAR(20) DEFAULT 'default',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. form_fields 테이블 (폼 항목)
CREATE TABLE IF NOT EXISTS form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    label VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('number', 'text', 'select', 'steps', 'checkbox', 'image')),
    options JSONB, -- select: 선택 옵션들, steps: 스텝 이름들, image: [URL]
    field_order INT NOT NULL,
    required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. members 테이블 (멤버)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(form_id, name)
);

-- 4. responses 테이블 (응답)
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(form_id, member_id, date) -- 한 멤버당 하루에 하나의 응답만
);

-- 5. response_values 테이블 (응답 값)
CREATE TABLE IF NOT EXISTS response_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES form_fields(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(response_id, field_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_members_form_id ON members(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_member_id ON responses(member_id);
CREATE INDEX IF NOT EXISTS idx_responses_date ON responses(date);
CREATE INDEX IF NOT EXISTS idx_response_values_response_id ON response_values(response_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_responses_updated_at
    BEFORE UPDATE ON responses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 활성화 - 필요시 정책 추가
-- ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE response_values ENABLE ROW LEVEL SECURITY;

-- 일단 모든 테이블에 공개 접근 허용 (개발용)
-- 프로덕션에서는 적절한 RLS 정책 설정 필요
