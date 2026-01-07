'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Form } from '@/types/database';

export default function AdminDashboard() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/forms');
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Failed to fetch forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (formId: string, formName: string) => {
    if (!confirm(`"${formName}" 폼을 삭제하시겠습니까?\n모든 응답 데이터도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      if (res.ok) {
        setForms(forms.filter((f) => f.id !== formId));
        toast.success('폼이 삭제되었습니다');
      } else {
        toast.error('삭제에 실패했습니다');
      }
    } catch {
      toast.error('오류가 발생했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">DCU 관리자</h1>
            <Link
              href="/admin/forms/new"
              className="px-4 md:px-5 py-2.5 md:py-3 bg-gray-900 text-white text-sm md:text-base font-medium rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-900/20"
            >
              새 폼 만들기
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {loading ? (
          <div className="text-center py-16 text-gray-400">로딩 중...</div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-400 mb-4">아직 생성된 폼이 없습니다</p>
            <Link
              href="/admin/forms/new"
              className="text-gray-900 font-medium underline hover:no-underline"
            >
              첫 번째 폼 만들기
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {forms.map((form) => (
              <div
                key={form.id}
                onClick={() => router.push(`/admin/forms/${form.id}`)}
                className="p-5 md:p-6 bg-white rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{form.name}</h2>
                    {form.description && (
                      <p className="text-gray-500 text-sm md:text-base mt-1 line-clamp-2">{form.description}</p>
                    )}
                    <p className="text-xs md:text-sm text-gray-300 mt-3">
                      {new Date(form.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/forms/${form.id}/results`}
                      className="px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      결과
                    </Link>
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/form/${form.short_id}`;
                        navigator.clipboard.writeText(url);
                        toast.success('링크가 복사되었습니다');
                      }}
                      className="px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      링크 복사
                    </button>
                    <button
                      onClick={() => handleDelete(form.id, form.name)}
                      className="px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
