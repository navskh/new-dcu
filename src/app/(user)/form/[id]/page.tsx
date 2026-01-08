'use client';

import { useState, useEffect, useRef, use } from 'react';
import type { FormField } from '@/types/database';

interface FormData {
  id: string;
  name: string;
  description: string | null;
  theme: 'default' | 'navy';
  fields: FormField[];
}

// 테마 색상 정의
const themeColors = {
  default: {
    primary: '#111827', // gray-900
    primaryHover: '#1f2937', // gray-800
    progressBar: '#111827',
    focusRing: '#111827',
    buttonSelected: '#111827',
    headerBg: 'bg-white/95',
    headerText: 'text-gray-900',
  },
  navy: {
    primary: '#173476',
    primaryHover: '#1e4493',
    progressBar: '#173476',
    focusRing: '#173476',
    buttonSelected: '#173476',
    headerBg: 'bg-white/95',
    headerText: 'text-[#173476]',
  },
};

export default function FormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});
  const stepRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 페이지 타이틀 설정
  useEffect(() => {
    if (form?.name) {
      document.title = form.name;
    }
    return () => {
      document.title = 'DCU';
    };
  }, [form?.name]);

  // 필드 완료 여부 확인
  const isFieldCompleted = (field: FormField) => {
    const value = values[field.id];
    if (!value) return false;

    switch (field.type) {
      case 'number':
        return value !== '' && value !== '0';
      case 'text':
        return value.trim() !== '';
      case 'select':
        return value !== '';
      case 'checkbox':
        return value === 'true';
      case 'steps':
        try {
          const stepValues = JSON.parse(value);
          return Object.values(stepValues).some((v) => (v as number) > 0);
        } catch {
          return false;
        }
      default:
        return false;
    }
  };

  // 진행률 계산
  const getProgress = () => {
    if (!form) return { completed: 0, total: 0 };
    const editableFields = form.fields.filter((f) => f.type !== 'image');
    const completedCount = editableFields.filter(isFieldCompleted).length;
    // 이름도 포함
    const nameCompleted = memberName.trim() !== '';
    return {
      completed: completedCount + (nameCompleted ? 1 : 0),
      total: editableFields.length + 1,
    };
  };

  // 다음 필드로 포커스 이동
  const focusNextField = (currentIndex: number, depth = 0) => {
    if (!form || depth > form.fields.length) return; // 무한루프 방지

    const nextField = form.fields[currentIndex + 1];
    if (nextField) {
      // 다음 필드가 steps면 첫 번째 스텝으로 포커스
      if (nextField.type === 'steps') {
        const steps = (nextField.options as string[]) || [];
        if (steps.length > 0) {
          setTimeout(() => {
            stepRefs.current[`${nextField.id}_${steps[0]}`]?.focus();
          }, 50);
        } else {
          focusNextField(currentIndex + 1, depth + 1);
        }
      } else if (nextField.type === 'checkbox' || nextField.type === 'image' ||
                 (nextField.type === 'select' && ((nextField.options as string[]) || []).length < 10)) {
        // 체크박스, 이미지, 버튼형 선택은 그 다음으로 스킵
        focusNextField(currentIndex + 1, depth + 1);
      } else {
        setTimeout(() => {
          inputRefs.current[nextField.id]?.focus();
        }, 50);
      }
    }
  };

  // localStorage에서 이름 불러오기
  useEffect(() => {
    const savedName = localStorage.getItem(`dcu_name_${id}`);
    if (savedName) {
      setMemberName(savedName);
    }
  }, [id]);

  // 폼 데이터 불러오기
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${id}`);
        if (res.ok) {
          const data = await res.json();
          setForm(data);
          // 초기값 설정
          const initialValues: Record<string, string> = {};
          data.fields.forEach((field: FormField) => {
            if (field.type === 'number') {
              initialValues[field.id] = '0';
            } else if (field.type === 'steps') {
              // steps는 각 스텝별 0으로 초기화
              const steps = (field.options as string[]) || [];
              const stepValues: Record<string, number> = {};
              steps.forEach((step) => { stepValues[step] = 0; });
              initialValues[field.id] = JSON.stringify(stepValues);
            } else if (field.type === 'checkbox') {
              initialValues[field.id] = 'false';
            } else {
              initialValues[field.id] = '';
            }
          });
          setValues(initialValues);
        }
      } catch (error) {
        console.error('Failed to fetch form:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  // 이름 저장
  const handleNameChange = (name: string) => {
    setMemberName(name);
    localStorage.setItem(`dcu_name_${id}`, name);
  };

  // 값 변경
  const handleValueChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  // 숫자 필드 변경 (Enter로만 이동, 타임아웃 제거)
  const handleNumberChange = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  // 선택형 필드 (즉시 이동)
  const handleSelectChange = (fieldId: string, value: string, fieldIndex: number) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    focusNextField(fieldIndex);
  };

  // 체크박스 토글 (클릭 기반이라 자동 이동 안함)
  const handleCheckboxToggle = (fieldId: string) => {
    setValues((prev) => {
      const current = prev[fieldId] === 'true';
      return { ...prev, [fieldId]: (!current).toString() };
    });
  };

  // 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberName.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    // 필수 필드 검증
    const missingFields = form?.fields.filter(
      (field) => field.required && !values[field.id]?.trim()
    );
    if (missingFields && missingFields.length > 0) {
      alert(`${missingFields[0].label}을(를) 입력해주세요.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: id,
          memberName,
          values,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        alert(data.error || '제출에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200/70">
        {/* 헤더 스켈레톤 */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-lg mx-auto px-4 py-4">
            <div className="h-7 bg-gray-200 rounded-lg w-1/3 animate-pulse"></div>
          </div>
          <div className="h-1 bg-gray-100"></div>
        </div>
        {/* 컨텐츠 스켈레톤 */}
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-12 bg-gray-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200/70">
        <p className="text-gray-500">폼을 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-200/70">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg shadow-gray-300/50">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="text-xl font-bold mb-2">제출 완료!</h1>
          <p className="text-gray-500 mb-6">오늘도 수고하셨습니다.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="text-gray-600 underline hover:no-underline"
          >
            다시 입력하기
          </button>
        </div>
      </div>
    );
  }

  const progress = getProgress();
  const colors = themeColors[form.theme || 'default'];

  return (
    <div className="min-h-screen bg-gray-200/70">
      {/* 고정 헤더 + 진행률 */}
      <div className={`sticky top-0 z-10 ${colors.headerBg} backdrop-blur-sm shadow-sm`}>
        <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className={`text-lg md:text-xl lg:text-2xl font-bold ${colors.headerText}`}>{form.name}</h1>
            <span className="text-xs md:text-sm text-gray-400 font-medium tabular-nums">
              {progress.completed} / {progress.total}
            </span>
          </div>
          {/* 진행률 바 */}
          <div className="h-1 md:h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{ width: `${(progress.completed / progress.total) * 100}%`, backgroundColor: colors.progressBar }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-8">
        {form.description && (
          <p className="text-gray-500 text-sm mb-4">{form.description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-2 md:space-y-3">
          {/* 이름 입력 */}
          <div
            className={`p-4 md:p-5 rounded-2xl transition-all duration-200 ${
              focusedFieldId === 'name'
                ? 'bg-white shadow-xl shadow-gray-400/30 scale-[1.02]'
                : memberName.trim()
                  ? 'bg-white/80 shadow-md shadow-gray-300/30'
                  : 'bg-white shadow-md shadow-gray-300/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <label className={`text-sm md:text-base font-medium transition-colors ${
                focusedFieldId === 'name' ? 'text-gray-900' : 'text-gray-400'
              }`}>
                이름
              </label>
              {memberName.trim() && focusedFieldId !== 'name' && (
                <span className="text-xs md:text-sm text-green-500 font-medium">완료</span>
              )}
            </div>
            <input
              type="text"
              enterKeyHint="next"
              value={memberName}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setFocusedFieldId('name')}
              onBlur={() => setFocusedFieldId(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  focusNextField(-1);
                }
              }}
              placeholder="이름을 입력하세요"
              className="w-full h-11 md:h-12 px-3 md:px-4 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:bg-white text-base md:text-lg transition-all"
              style={{ '--tw-ring-color': colors.focusRing } as React.CSSProperties}
            />
          </div>

          {/* 필드 입력 */}
          {form.fields.map((field, index) => {
            const completed = isFieldCompleted(field);
            const focused = focusedFieldId === field.id;

            // 이미지는 카드 없이 바로 표시
            if (field.type === 'image') {
              const imageUrl = (field.options as string[])?.[0];
              if (!imageUrl) return null;
              return (
                <img
                  key={field.id}
                  src={imageUrl}
                  alt={field.label}
                  className="w-full rounded-2xl object-cover my-4 md:my-6"
                />
              );
            }

            return (
            <div
              key={field.id}
              className={`p-4 md:p-5 rounded-2xl transition-all duration-200 ${
                focused
                  ? 'bg-white shadow-xl shadow-gray-400/30 scale-[1.02]'
                  : completed
                    ? 'bg-white/80 shadow-md shadow-gray-300/30'
                    : 'bg-white shadow-md shadow-gray-300/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <label className={`text-sm md:text-base font-medium transition-colors ${
                  focused ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {field.label}
                </label>
                {completed && !focused && (
                  <span className="text-xs md:text-sm text-green-500 font-medium">완료</span>
                )}
              </div>

              {field.type === 'number' && (
                <input
                  ref={(el) => { inputRefs.current[field.id] = el; }}
                  type="number"
                  inputMode="numeric"
                  enterKeyHint="next"
                  value={values[field.id] || ''}
                  onChange={(e) => handleNumberChange(field.id, e.target.value)}
                  onFocus={(e) => {
                    setFocusedFieldId(field.id);
                    e.target.select();
                  }}
                  onBlur={() => setFocusedFieldId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      focusNextField(index);
                    }
                  }}
                  placeholder={(field.options as string[])?.[0] || '0'}
                  className="w-full h-11 md:h-12 px-3 md:px-4 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:bg-white text-base md:text-lg text-center transition-all"
                  style={{ '--tw-ring-color': colors.focusRing } as React.CSSProperties}
                />
              )}

              {field.type === 'text' && (
                <input
                  ref={(el) => { inputRefs.current[field.id] = el; }}
                  type="text"
                  enterKeyHint="next"
                  value={values[field.id] || ''}
                  onChange={(e) => handleValueChange(field.id, e.target.value)}
                  onFocus={() => setFocusedFieldId(field.id)}
                  onBlur={() => setFocusedFieldId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      focusNextField(index);
                    }
                  }}
                  placeholder={(field.options as string[])?.[0] || ''}
                  className="w-full h-11 md:h-12 px-3 md:px-4 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:bg-white text-base md:text-lg transition-all"
                  style={{ '--tw-ring-color': colors.focusRing } as React.CSSProperties}
                />
              )}

              {field.type === 'select' && (field.options as string[] || []).length < 10 && (
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {(field.options as string[] || []).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleSelectChange(field.id, option, index)}
                      className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-sm md:text-base font-medium transition-all ${
                        values[field.id] === option
                          ? 'text-white shadow-md'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                      style={values[field.id] === option ? { backgroundColor: colors.buttonSelected } : {}}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {field.type === 'select' && (field.options as string[] || []).length >= 10 && (
                <select
                  ref={(el) => { inputRefs.current[field.id] = el; }}
                  value={values[field.id] || ''}
                  onChange={(e) => handleSelectChange(field.id, e.target.value, index)}
                  onFocus={() => setFocusedFieldId(field.id)}
                  onBlur={() => setFocusedFieldId(null)}
                  className="w-full h-11 md:h-12 px-3 md:px-4 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:bg-white text-base md:text-lg transition-all"
                  style={{ '--tw-ring-color': colors.focusRing } as React.CSSProperties}
                >
                  <option value="">선택하세요</option>
                  {(field.options as string[] || []).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'steps' && (
                <div className="flex gap-3 md:gap-4 flex-wrap">
                  {(field.options as string[] || []).map((step, stepIndex) => {
                    const steps = (field.options as string[]) || [];
                    const stepValues = JSON.parse(values[field.id] || '{}');
                    const isLastStep = stepIndex === steps.length - 1;
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5 md:gap-2">
                        <input
                          ref={(el) => { stepRefs.current[`${field.id}_${step}`] = el; }}
                          type="number"
                          inputMode="numeric"
                          enterKeyHint="next"
                          value={stepValues[step] ?? 0}
                          onChange={(e) => {
                            const newStepValues = { ...stepValues, [step]: parseInt(e.target.value) || 0 };
                            setValues((prev) => ({ ...prev, [field.id]: JSON.stringify(newStepValues) }));
                          }}
                          onFocus={(e) => {
                            setFocusedFieldId(field.id);
                            e.target.select();
                          }}
                          onBlur={() => setFocusedFieldId(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (isLastStep) {
                                focusNextField(index);
                              } else {
                                const nextStep = steps[stepIndex + 1];
                                stepRefs.current[`${field.id}_${nextStep}`]?.focus();
                              }
                            }
                          }}
                          className="w-14 md:w-16 h-11 md:h-12 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:bg-white text-base md:text-lg text-center transition-all"
                          style={{ '--tw-ring-color': colors.focusRing } as React.CSSProperties}
                        />
                        <span className="text-xs md:text-sm text-gray-400 font-medium">{step}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {field.type === 'checkbox' && (
                <button
                  type="button"
                  onClick={() => handleCheckboxToggle(field.id)}
                  className={`w-full h-12 md:h-14 rounded-xl font-medium text-sm md:text-base transition-all ${
                    values[field.id] === 'true'
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  style={values[field.id] === 'true' ? { backgroundColor: colors.buttonSelected } : {}}
                >
                  {values[field.id] === 'true'
                    ? `✓ ${(field.options as string[])?.[0] || '완료'}`
                    : (field.options as string[])?.[1] || '탭하여 완료'}
                </button>
              )}
            </div>
            );
          })}

          {/* 제출 버튼 */}
          <div className="pt-4 md:pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 md:h-14 rounded-xl text-white font-medium text-base md:text-lg active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg"
              style={{
                backgroundColor: colors.primary,
                boxShadow: `0 10px 15px -3px ${colors.primary}33, 0 4px 6px -4px ${colors.primary}33`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primaryHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = colors.primary; }}
            >
              {submitting ? '제출 중...' : '제출하기'}
            </button>
          </div>
        </form>

        <p className="text-center text-xs md:text-sm text-gray-300 mt-8 pb-4">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </p>
      </div>
    </div>
  );
}
