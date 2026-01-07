import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/forms/[id]/responses - 폼 응답 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // 특정 날짜 필터 (YYYY-MM-DD)

    // 폼 정보 조회
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, name, fields:form_fields(*)')
      .eq('id', formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // 응답 조회 쿼리 빌드
    let query = supabase
      .from('responses')
      .select(`
        id,
        date,
        created_at,
        member:members(id, name),
        values:response_values(field_id, value)
      `)
      .eq('form_id', formId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // 날짜 필터 적용
    if (date) {
      query = query.eq('date', date);
    }

    const { data: responses, error: responsesError } = await query;

    if (responsesError) throw responsesError;

    // 필드 정보를 순서대로 정렬
    const sortedFields = (form.fields as Array<{ id: string; label: string; type: string; field_order: number; options: string[] | null }>)
      .sort((a, b) => a.field_order - b.field_order);

    // 응답 데이터 정리
    const formattedResponses = responses?.map((response) => {
      const valuesMap: Record<string, string> = {};
      (response.values as Array<{ field_id: string; value: string }>)?.forEach((v) => {
        valuesMap[v.field_id] = v.value;
      });

      return {
        id: response.id,
        date: response.date,
        createdAt: response.created_at,
        memberName: (response.member as { id: string; name: string })?.name || '알 수 없음',
        values: valuesMap,
      };
    }) || [];

    // 날짜별로 그룹화
    const groupedByDate: Record<string, typeof formattedResponses> = {};
    formattedResponses.forEach((response) => {
      if (!groupedByDate[response.date]) {
        groupedByDate[response.date] = [];
      }
      groupedByDate[response.date].push(response);
    });

    return NextResponse.json({
      form: {
        id: form.id,
        name: form.name,
      },
      fields: sortedFields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options,
      })),
      responses: formattedResponses,
      groupedByDate,
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
