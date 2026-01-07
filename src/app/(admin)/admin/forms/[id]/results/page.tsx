'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';

interface FieldInfo {
  id: string;
  label: string;
  type: string;
  options: string[] | null;
}

interface ResponseData {
  id: string;
  date: string;
  createdAt: string;
  memberName: string;
  values: Record<string, string>;
}

interface ResultsData {
  form: { id: string; name: string };
  fields: FieldInfo[];
  responses: ResponseData[];
  groupedByDate: Record<string, ResponseData[]>;
}

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [captureMode, setCaptureMode] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/forms/${id}/responses`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
          // 기본으로 오늘 날짜 또는 가장 최근 날짜 선택
          const today = new Date().toISOString().split('T')[0];
          const dates = Object.keys(result.groupedByDate).sort().reverse();
          if (dates.includes(today)) {
            setSelectedDate(today);
          } else if (dates.length > 0) {
            setSelectedDate(dates[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id]);

  // 값 포맷팅 헬퍼
  const formatValue = (field: FieldInfo, value: string) => {
    if (!value) return '-';

    if (field.type === 'checkbox') {
      return value === 'true' ? '✓' : '-';
    }

    if (field.type === 'steps') {
      try {
        const stepValues = JSON.parse(value);
        const steps = field.options || [];
        // 스텝 순서대로 값만 "-"로 연결 (예: 1-1-0-0)
        return steps.map((step) => stepValues[step] ?? 0).join('-');
      } catch {
        return value;
      }
    }

    return value;
  };

  // 스텝 필드 헤더 포맷팅 (예: 전도 (시도-복음-영접-컨택))
  const formatFieldHeader = (field: FieldInfo) => {
    if (field.type === 'steps' && field.options && field.options.length > 0) {
      return (
        <div>
          <div>{field.label}</div>
          <div className="text-[10px] font-normal text-gray-400">
            ({field.options.join('-')})
          </div>
        </div>
      );
    }
    return field.label;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">로딩 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const dates = Object.keys(data.groupedByDate).sort().reverse();
  const currentResponses = selectedDate ? data.groupedByDate[selectedDate] || [] : [];
  const displayFields = data.fields.filter((f) => f.type !== 'image');

  // 캡처 모드일 때는 간단한 UI로 표시
  if (captureMode) {
    return (
      <div className="min-h-screen bg-white p-4">
        <button
          onClick={() => setCaptureMode(false)}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 text-white rounded-xl shadow-lg print:hidden"
        >
          돌아가기
        </button>

        <div ref={captureRef} className="max-w-4xl mx-auto bg-white">
          {/* 헤더 */}
          <div className="text-center mb-4 pt-2">
            <h1 className="text-xl font-bold text-gray-900">{data.form.name}</h1>
            <p className="text-sm text-gray-500">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
              {' · '}
              {currentResponses.length}명 참여
            </p>
          </div>

          {/* 컴팩트 테이블 */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-200 px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                  이름
                </th>
                {displayFields.map((field) => (
                  <th
                    key={field.id}
                    className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-700 whitespace-nowrap"
                  >
                    {field.type === 'steps' && field.options && field.options.length > 0 ? (
                      <div>
                        <div>{field.label}</div>
                        <div className="text-[10px] font-normal text-gray-400">
                          ({field.options.join('-')})
                        </div>
                      </div>
                    ) : (
                      field.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentResponses.map((response) => (
                <tr key={response.id}>
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                    {response.memberName}
                  </td>
                  {displayFields.map((field) => (
                    <td
                      key={field.id}
                      className="border border-gray-200 px-3 py-2 text-center text-gray-600 whitespace-nowrap"
                    >
                      {formatValue(field, response.values[field.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {/* 합계 행 */}
            {displayFields.some((f) => f.type === 'number') && (
              <tfoot>
                <tr className="bg-gray-100 font-medium">
                  <td className="border border-gray-200 px-3 py-2 text-gray-700 whitespace-nowrap">합계</td>
                  {displayFields.map((field) => {
                    if (field.type !== 'number') {
                      return (
                        <td key={field.id} className="border border-gray-200 px-3 py-2 text-center text-gray-400">
                          -
                        </td>
                      );
                    }
                    const sum = currentResponses.reduce((acc, r) => {
                      const val = parseFloat(r.values[field.id]) || 0;
                      return acc + val;
                    }, 0);
                    return (
                      <td key={field.id} className="border border-gray-200 px-3 py-2 text-center text-gray-900 font-bold">
                        {sum}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                ←
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{data.form.name}</h1>
                <p className="text-sm text-gray-400">결과 보기</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCaptureMode(true)}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                캡처용 보기
              </button>
              <Link
                href={`/admin/forms/${id}`}
                className="px-4 py-2 text-sm font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                폼 편집
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {dates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-400 mb-2">아직 응답이 없습니다</p>
            <p className="text-sm text-gray-300">폼 링크를 공유하여 응답을 받아보세요</p>
          </div>
        ) : (
          <>
            {/* 날짜 선택 */}
            <div className="mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((date) => {
                  const dateObj = new Date(date + 'T00:00:00');
                  const isToday = date === new Date().toISOString().split('T')[0];
                  const dayName = dateObj.toLocaleDateString('ko-KR', { weekday: 'short' });
                  const monthDay = dateObj.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
                        selectedDate === date
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-white text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-sm">{monthDay}</div>
                      <div className="text-xs opacity-70">
                        {isToday ? '오늘' : dayName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 응답 수 */}
            <div className="mb-4 text-sm text-gray-400">
              {selectedDate && (
                <>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  })}
                  {' · '}
                  {currentResponses.length}명 참여
                </>
              )}
            </div>

            {/* 결과 테이블 */}
            {currentResponses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <p className="text-gray-400">해당 날짜의 응답이 없습니다</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-400 whitespace-nowrap">
                        이름
                      </th>
                      {displayFields.map((field) => (
                        <th
                          key={field.id}
                          className="text-center px-3 py-2 text-sm font-medium text-gray-400 whitespace-nowrap"
                        >
                          {formatFieldHeader(field)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentResponses.map((response, index) => (
                      <tr
                        key={response.id}
                        className={index !== currentResponses.length - 1 ? 'border-b border-gray-50' : ''}
                      >
                        <td className="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                          {response.memberName}
                        </td>
                        {displayFields.map((field) => (
                          <td
                            key={field.id}
                            className="px-3 py-2.5 text-center text-gray-600 whitespace-nowrap"
                          >
                            {formatValue(field, response.values[field.id])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  {/* 합계 행 */}
                  {displayFields.some((f) => f.type === 'number') && (
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-600 whitespace-nowrap">합계</td>
                        {displayFields.map((field) => {
                          if (field.type !== 'number') {
                            return (
                              <td key={field.id} className="px-3 py-2.5 text-center text-gray-300">-</td>
                            );
                          }
                          const sum = currentResponses.reduce((acc, r) => {
                            const val = parseFloat(r.values[field.id]) || 0;
                            return acc + val;
                          }, 0);
                          return (
                            <td key={field.id} className="px-3 py-2.5 text-center font-bold text-gray-900">
                              {sum}
                            </td>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* 전체 통계 */}
            <div className="mt-8 p-5 bg-white rounded-2xl shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">전체 통계</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{dates.length}</div>
                  <div className="text-sm text-gray-400">기록된 날</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">{data.responses.length}</div>
                  <div className="text-sm text-gray-400">총 응답 수</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">
                    {new Set(data.responses.map((r) => r.memberName)).size}
                  </div>
                  <div className="text-sm text-gray-400">참여 멤버</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-2xl font-bold text-gray-900">
                    {dates.length > 0
                      ? Math.round(data.responses.length / dates.length * 10) / 10
                      : 0}
                  </div>
                  <div className="text-sm text-gray-400">일 평균 참여</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
