import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Vercel Cron으로 5분마다 실행 - Supabase cold start 방지
export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 개발 환경에서는 허용
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const start = Date.now();

    // 간단한 쿼리로 DB 연결 유지
    const { data, error } = await supabase
      .from('forms')
      .select('id')
      .limit(1);

    const duration = Date.now() - start;

    if (error) throw error;

    console.log(`[Keep-alive] Supabase ping: ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Keep-alive] Error:', error);
    return NextResponse.json(
      { error: 'Keep-alive failed' },
      { status: 500 }
    );
  }
}
