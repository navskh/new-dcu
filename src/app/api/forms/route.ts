import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 6자리 랜덤 키 생성
function generateShortId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET /api/forms - 폼 목록 조회
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

// POST /api/forms - 폼 생성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, theme = 'default', fields } = body;

    // 짧은 ID 생성 (중복 체크)
    let shortId = generateShortId();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('forms')
        .select('id')
        .eq('short_id', shortId)
        .single();

      if (!existing) break;
      shortId = generateShortId();
      attempts++;
    }

    // 폼 생성
    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({ name, description, theme, short_id: shortId })
      .select()
      .single();

    if (formError) throw formError;

    // 필드 생성
    if (fields && fields.length > 0) {
      const fieldsWithFormId = fields.map((field: { label: string; type: string; options?: string[]; required?: boolean }, index: number) => ({
        form_id: form.id,
        label: field.label,
        type: field.type,
        options: field.options || null,
        field_order: index,
        required: field.required ?? true,
      }));

      const { error: fieldsError } = await supabase
        .from('form_fields')
        .insert(fieldsWithFormId);

      if (fieldsError) throw fieldsError;
    }

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    );
  }
}
