import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// UUID 형식 체크
function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// POST /api/responses - 응답 제출
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formId: inputFormId, memberName, values } = body;

    // short_id인 경우 실제 form UUID 조회
    let formId = inputFormId;
    if (!isUUID(inputFormId)) {
      const { data: form } = await supabase
        .from('forms')
        .select('id')
        .eq('short_id', inputFormId)
        .single();

      if (!form) {
        return NextResponse.json(
          { error: 'Form not found' },
          { status: 404 }
        );
      }
      formId = form.id;
    }

    // 오늘 날짜 (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // 멤버 조회 또는 생성
    let { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('form_id', formId)
      .eq('name', memberName)
      .single();

    if (!member) {
      const { data: newMember, error: memberError } = await supabase
        .from('members')
        .insert({ form_id: formId, name: memberName })
        .select()
        .single();

      if (memberError) throw memberError;
      member = newMember;
    }

    // 오늘 응답이 있는지 확인
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('id')
      .eq('form_id', formId)
      .eq('member_id', member.id)
      .eq('date', today)
      .single();

    let responseId: string;

    if (existingResponse) {
      // 기존 응답 업데이트 - response_values 삭제 후 재생성
      responseId = existingResponse.id;
      await supabase
        .from('response_values')
        .delete()
        .eq('response_id', responseId);
    } else {
      // 새 응답 생성
      const { data: newResponse, error: responseError } = await supabase
        .from('responses')
        .insert({
          form_id: formId,
          member_id: member.id,
          date: today,
        })
        .select()
        .single();

      if (responseError) throw responseError;
      responseId = newResponse.id;
    }

    // 응답 값 저장
    const responseValues = Object.entries(values).map(([fieldId, value]) => ({
      response_id: responseId,
      field_id: fieldId,
      value: String(value),
    }));

    if (responseValues.length > 0) {
      const { error: valuesError } = await supabase
        .from('response_values')
        .insert(responseValues);

      if (valuesError) throw valuesError;
    }

    return NextResponse.json({ success: true, responseId });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}
