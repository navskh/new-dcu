import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// UUID 형식 체크
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// GET /api/forms/[id] - 폼 상세 조회 (id 또는 short_id)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // UUID면 id로, 아니면 short_id로 조회
    const column = isUUID(id) ? 'id' : 'short_id';

    // 폼 조회
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq(column, id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      );
    }

    // 필드 조회
    const { data: fields, error: fieldsError } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', form.id)
      .order('field_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    return NextResponse.json({ ...form, fields: fields || [] });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}

// PUT /api/forms/[id] - 폼 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, theme, fields } = body;

    // 폼 업데이트
    const { error: formError } = await supabase
      .from('forms')
      .update({ name, description, theme })
      .eq('id', id);

    if (formError) throw formError;

    // 기존 필드 삭제 후 새로 추가
    if (fields) {
      await supabase.from('form_fields').delete().eq('form_id', id);

      if (fields.length > 0) {
        const fieldsWithFormId = fields.map((field: { label: string; type: string; options?: string[]; required?: boolean }, index: number) => ({
          form_id: id,
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
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

// DELETE /api/forms/[id] - 폼 삭제
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase.from('forms').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}
