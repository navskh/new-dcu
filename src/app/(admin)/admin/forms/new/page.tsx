'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Field {
  id: string;
  label: string;
  type: 'number' | 'text' | 'select' | 'steps' | 'checkbox' | 'image';
  options: string[];
  required: boolean;
}

export default function NewForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState<'default' | 'navy'>('default');
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fieldInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [lastAddedFieldId, setLastAddedFieldId] = useState<string | null>(null);

  const addField = useCallback(() => {
    const newId = crypto.randomUUID();
    setFields((prev) => [
      ...prev,
      {
        id: newId,
        label: '',
        type: 'number',
        options: [],
        required: true,
      },
    ]);
    setLastAddedFieldId(newId);
  }, []);

  useEffect(() => {
    if (lastAddedFieldId && fieldInputRefs.current[lastAddedFieldId]) {
      fieldInputRefs.current[lastAddedFieldId]?.focus();
      setLastAddedFieldId(null);
    }
  }, [lastAddedFieldId, fields]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addField();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addField]);

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const newFields = [...fields];
    [newFields[index], newFields[newIndex]] = [newFields[newIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('폼 이름을 입력해주세요.');
      return;
    }
    if (fields.length === 0) {
      alert('최소 하나의 항목을 추가해주세요.');
      return;
    }
    if (fields.some((f) => f.type !== 'image' && !f.label.trim())) {
      alert('모든 항목의 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          theme,
          fields: fields.map((f) => ({
            label: f.label,
            type: f.type,
            options: f.options.filter(Boolean).length > 0 ? f.options.filter(Boolean) : null,
            required: f.required,
          })),
        }),
      });

      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        alert('폼 생성에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">새 폼 만들기</h1>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 text-sm md:text-base font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              미리보기
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          {/* 폼 기본 정보 */}
          <div className="p-5 md:p-6 bg-white rounded-2xl shadow-sm space-y-4">
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-400 mb-2">
                폼 이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: DCU 체킹"
                className="w-full h-11 md:h-12 px-3 md:px-4 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-base md:text-lg transition-all"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-400 mb-2">
                설명 (선택)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="폼에 대한 설명"
                rows={2}
                className="w-full px-3 md:px-4 py-3 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-base md:text-lg transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium text-gray-400 mb-2">테마</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('default')}
                  className={`flex-1 h-12 rounded-xl font-medium transition-all ${
                    theme === 'default'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-gray-900 border-2 border-white shadow-sm" />
                    기본
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('navy')}
                  className={`flex-1 h-12 rounded-xl font-medium transition-all ${
                    theme === 'navy'
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  style={theme === 'navy' ? { backgroundColor: '#173476' } : {}}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: '#173476' }} />
                    네이비
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 항목 목록 */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">항목</h2>
              <button
                type="button"
                onClick={addField}
                className="px-4 py-2 text-sm md:text-base font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                + 항목 추가 <span className="text-gray-400 text-xs ml-1">(⌘+Enter)</span>
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <div className="text-3xl mb-3">📋</div>
                <p className="text-gray-400">항목을 추가해주세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-4 md:p-5 bg-white rounded-2xl shadow-sm"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => moveField(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moveField(index, 'down')}
                          disabled={index === fields.length - 1}
                          className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex gap-2 md:gap-3">
                          {field.type !== 'image' && (
                            <input
                              ref={(el) => { fieldInputRefs.current[field.id] = el; }}
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                              placeholder="항목 이름"
                              className="flex-1 h-10 md:h-11 px-3 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-sm md:text-base transition-all"
                            />
                          )}
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const newType = e.target.value as Field['type'];
                              const updates: Partial<Field> = { type: newType };
                              if ((newType === 'steps' || newType === 'select') && field.options.length === 0) {
                                updates.options = [''];
                              }
                              if (newType === 'image') {
                                updates.required = false;
                              }
                              updateField(field.id, updates);
                            }}
                            className="h-10 md:h-11 px-3 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm md:text-base transition-all"
                          >
                            <option value="number">숫자</option>
                            <option value="text">텍스트</option>
                            <option value="select">선택</option>
                            <option value="steps">스텝별</option>
                            <option value="checkbox">체크</option>
                            <option value="image">이미지</option>
                          </select>
                        </div>

                        {(field.type === 'number' || field.type === 'text') && (
                          <input
                            type="text"
                            value={field.options[0] || ''}
                            onChange={(e) => updateField(field.id, { options: [e.target.value] })}
                            placeholder="placeholder (선택)"
                            className="w-full h-9 px-3 text-sm rounded-lg border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                          />
                        )}

                        {field.type === 'checkbox' && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={field.options[0] || ''}
                              onChange={(e) => updateField(field.id, { options: [e.target.value, field.options[1] || ''] })}
                              placeholder="완료 텍스트"
                              className="flex-1 h-9 px-3 text-sm rounded-lg border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                            />
                            <input
                              type="text"
                              value={field.options[1] || ''}
                              onChange={(e) => updateField(field.id, { options: [field.options[0] || '', e.target.value] })}
                              placeholder="미완료 텍스트"
                              className="flex-1 h-9 px-3 text-sm rounded-lg border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                            />
                          </div>
                        )}

                        {field.type === 'select' && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {field.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...field.options];
                                      newOptions[optionIndex] = e.target.value;
                                      updateField(field.id, { options: newOptions });
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const container = e.currentTarget.parentElement?.parentElement;
                                        updateField(field.id, { options: [...field.options, ''] });
                                        setTimeout(() => {
                                          const inputs = container?.querySelectorAll('input[type="text"]');
                                          if (inputs) (inputs[inputs.length - 1] as HTMLInputElement)?.focus();
                                        }, 0);
                                      }
                                    }}
                                    placeholder={`옵션${optionIndex + 1}`}
                                    className="w-24 h-8 px-2 text-sm rounded-lg border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = field.options.filter((_, i) => i !== optionIndex);
                                      updateField(field.id, { options: newOptions });
                                    }}
                                    className="text-gray-300 hover:text-red-500 text-sm transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => updateField(field.id, { options: [...field.options, ''] })}
                                className="h-8 px-3 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                + 옵션
                              </button>
                            </div>
                            <p className="text-xs text-gray-300">
                              {field.options.length >= 10 ? '드롭박스로 표시' : '버튼형으로 표시'}
                            </p>
                          </div>
                        )}

                        {field.type === 'steps' && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {field.options.map((step, stepIndex) => (
                                <div key={stepIndex} className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={step}
                                    onChange={(e) => {
                                      const newOptions = [...field.options];
                                      newOptions[stepIndex] = e.target.value;
                                      updateField(field.id, { options: newOptions });
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const container = e.currentTarget.parentElement?.parentElement;
                                        updateField(field.id, { options: [...field.options, ''] });
                                        setTimeout(() => {
                                          const inputs = container?.querySelectorAll('input[type="text"]');
                                          if (inputs) (inputs[inputs.length - 1] as HTMLInputElement)?.focus();
                                        }, 0);
                                      }
                                    }}
                                    placeholder={`스텝${stepIndex + 1}`}
                                    className="w-20 h-8 px-2 text-sm rounded-lg border-0 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newOptions = field.options.filter((_, i) => i !== stepIndex);
                                      updateField(field.id, { options: newOptions });
                                    }}
                                    className="text-gray-300 hover:text-red-500 text-sm transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => updateField(field.id, { options: [...field.options, ''] })}
                                className="h-8 px-3 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                + 스텝
                              </button>
                            </div>
                          </div>
                        )}

                        {field.type === 'image' && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={field.options[0] || ''}
                              onChange={(e) => updateField(field.id, { options: [e.target.value] })}
                              placeholder="이미지 URL (https://...)"
                              className="w-full h-10 md:h-11 px-3 rounded-xl border-0 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white text-sm md:text-base transition-all"
                            />
                            {field.options[0] && (
                              <img
                                src={field.options[0]}
                                alt="미리보기"
                                className="max-h-32 rounded-xl object-contain"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        )}

                        {field.type !== 'image' && (
                          <label className="flex items-center gap-2 text-sm text-gray-400">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateField(field.id, { required: e.target.checked })}
                              className="rounded"
                            />
                            필수 항목
                          </label>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeField(field.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-12 md:h-14 rounded-xl bg-gray-100 font-medium text-gray-600 hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 md:h-14 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-gray-900/20"
            >
              {loading ? '생성 중...' : '폼 생성'}
            </button>
          </div>
        </form>

        {/* 미리보기 모달 */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-50 w-full max-w-md max-h-[90vh] rounded-2xl overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-white">
                <span className="font-medium">미리보기</span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">{name || '폼 이름'}</h1>
                  {description && (
                    <p className="text-gray-500 mt-1">{description}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <label className="block text-sm font-medium text-gray-400 mb-2">이름</label>
                    <input
                      type="text"
                      disabled
                      placeholder="이름을 입력하세요"
                      className="w-full h-11 px-3 rounded-xl bg-gray-100 text-base"
                    />
                  </div>

                  {fields.map((field) => (
                    <div key={field.id} className="p-4 bg-white rounded-2xl shadow-sm">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        {field.label || '항목 이름'}
                      </label>

                      {field.type === 'number' && (
                        <input type="number" disabled placeholder={field.options[0] || '0'} className="w-full h-11 px-3 rounded-xl bg-gray-100 text-base text-center" />
                      )}
                      {field.type === 'text' && (
                        <input type="text" disabled placeholder={field.options[0] || ''} className="w-full h-11 px-3 rounded-xl bg-gray-100 text-base" />
                      )}
                      {field.type === 'select' && (
                        <div className="flex flex-wrap gap-2">
                          {field.options.filter(Boolean).map((option, i) => (
                            <button key={i} type="button" disabled className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium">{option}</button>
                          ))}
                        </div>
                      )}
                      {field.type === 'steps' && (
                        <div className="flex gap-3 flex-wrap">
                          {field.options.filter(Boolean).map((step, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                              <input type="number" disabled placeholder="0" className="w-14 h-11 rounded-xl bg-gray-100 text-base text-center" />
                              <span className="text-xs text-gray-400">{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {field.type === 'checkbox' && (
                        <button type="button" disabled className="w-full h-12 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium">
                          {field.options[1] || '탭하여 완료'}
                        </button>
                      )}
                      {field.type === 'image' && field.options[0] && (
                        <img src={field.options[0]} alt={field.label} className="w-full rounded-xl object-contain max-h-64" />
                      )}
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-gray-300">항목을 추가해주세요</div>
                  )}
                </div>

                <button type="button" disabled className="w-full h-12 mt-4 rounded-xl bg-gray-300 text-white font-medium">
                  제출하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
