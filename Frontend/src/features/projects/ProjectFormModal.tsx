import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, ProjectFormData } from '../../schema/project.schema';
import { AlertTriangle, Bot, Clock3, FileText, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { Department, Project, User } from '../../types';
import { departmentApi } from '../../services/api/department.api';
import { userApi } from '../../services/api/user.api';
import { AiProjectPlan, aiApi } from '../../services/api/ai.api';
import { extractDocumentText } from '../members/cv-extractor';

const MAX_AI_DOCUMENT_CHARS = 16000;

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (data: ProjectFormData, isEditing: boolean) => Promise<void>;
  initialProject?: Project | null;
  presentation?: 'modal' | 'page';
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialProject,
  presentation = 'modal',
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [documentStatus, setDocumentStatus] = useState('');
  const [isReadingDocument, setIsReadingDocument] = useState(false);
  const [plan, setPlan] = useState<AiProjectPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiError, setAiError] = useState('');
  useEffect(() => {
    Promise.all([departmentApi.getDepartments(), userApi.getUsers()])
      .then(([departmentData, userData]) => { setDepartments(departmentData); setUsers(userData); });
  }, []);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      departmentId: '',
      pmId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  const projectName = watch('name');
  const projectDescription = watch('description') || '';
  const departmentId = watch('departmentId');
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const availableMembers = useMemo(() => users.filter((user) =>
    user.status === 'ACTIVE'
    && (!departmentId || String(user.departmentId ?? user.department_id) === String(departmentId))
  ), [users, departmentId]);

  useEffect(() => {
    if (initialProject) {
      reset({
        name: initialProject.name,
        description: initialProject.description,
        departmentId: String(initialProject.departmentId ?? initialProject.department_id ?? ''),
        pmId: String(initialProject.pmId ?? initialProject.leader_id ?? ''),
        startDate: initialProject.startDate ?? initialProject.start_date,
        endDate: initialProject.endDate ?? initialProject.end_date,
      });
    } else {
      reset({
        name: '',
        description: '',
        departmentId: '',
        pmId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    }
  }, [initialProject, reset]);

  useEffect(() => {
    setPlan(null);
  }, [projectName, projectDescription, departmentId, aiDescription, documentText]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: ProjectFormData) => {
    setSubmitError('');
    try {
      await onSubmitSuccess(data, !!initialProject);
      reset();
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể lưu dự án. Vui lòng thử lại.');
    }
  };

  const readProjectDocument = async (file?: File) => {
    setPlan(null);
    setAiError('');
    setDocumentName(file?.name || '');
    setDocumentText('');
    if (!file) {
      setDocumentStatus('');
      return;
    }
    setIsReadingDocument(true);
    setDocumentStatus('Đang đọc tài liệu...');
    try {
      const text = await extractDocumentText(file, setDocumentStatus);
      setDocumentText(text);
      setDocumentStatus(`Đã trích xuất ${text.length.toLocaleString('vi-VN')} ký tự${text.length > MAX_AI_DOCUMENT_CHARS ? `; AI sẽ nhận tối đa ${MAX_AI_DOCUMENT_CHARS.toLocaleString('vi-VN')} ký tự đầu` : ''}.`);
    } catch (error) {
      setDocumentName('');
      setDocumentStatus('');
      setAiError(error instanceof Error ? error.message : 'Không thể đọc tài liệu dự án.');
    } finally {
      setIsReadingDocument(false);
    }
  };

  const generateProjectPlan = async () => {
    const name = projectName.trim();
    const creatorDescription = aiDescription.trim();
    const documentExcerpt = documentText.slice(0, MAX_AI_DOCUMENT_CHARS);
    if (!name || (!creatorDescription && !projectDescription.trim() && !documentExcerpt)) return;
    setPlan(null);
    setAiError('');
    setIsGeneratingPlan(true);
    try {
      const availableRoles = [...new Set(availableMembers
        .flatMap((user) => [user.specialization || '', ...(user.skills || [])])
        .map((item) => item.trim())
        .filter(Boolean))].slice(0, 30);
      const durationDays = startDate && endDate
        ? Math.max(1, Math.ceil((new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86400000) + 1)
        : undefined;
      const description = [
        projectDescription.trim() ? `Mô tả tóm tắt: ${projectDescription.trim()}` : '',
        creatorDescription ? `Yêu cầu chi tiết từ người tạo:\n${creatorDescription}` : '',
        documentExcerpt ? `Nội dung tài liệu ${documentName}:\n${documentExcerpt}` : '',
        availableRoles.length ? `Chuyên môn sẵn có trong phòng ban (không kèm thông tin cá nhân): ${availableRoles.join(', ')}` : '',
        'Hãy đề xuất đầu việc có thể triển khai và vai trò/chuyên môn phù hợp cho từng việc. Chỉ đưa ra gợi ý, không tự giả định đã phân công nhân sự.',
      ].filter(Boolean).join('\n\n');
      const generatedPlan = await aiApi.generateProjectPlan({
        projectName: name,
        description,
        ...(durationDays ? { estimatedDurationDays: durationDays } : {}),
        ...(availableRoles.length ? { availableRoles } : {}),
      });
      setPlan(generatedPlan);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Không thể tạo kế hoạch bằng AI.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const suggestMembersForRole = (role: string) => {
    const keywords = role.toLocaleLowerCase().split(/[^a-z0-9À-ỹ+#.]+/).filter((word) => word.length > 2);
    if (!keywords.length) return [];
    return availableMembers.filter((user) => {
      const profile = `${user.specialization || ''} ${(user.skills || []).join(' ')}`.toLocaleLowerCase();
      return keywords.some((keyword) => profile.includes(keyword));
    }).slice(0, 3);
  };

  const isPage = presentation === 'page';

  return (
    <div className={isPage ? 'w-full' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm'}>
      <div className={`w-full ${isPage ? 'rounded-3xl border border-slate-100 bg-white p-5 shadow-sm' : 'max-w-lg animate-in rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl zoom-in-95 fade-in duration-200'}`}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {initialProject ? 'Chỉnh sửa thông tin dự án' : 'Tạo dự án mới'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Phân cấp quản trị dự án theo chuẩn doanh nghiệp</p>
          </div>
          {!isPage && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
          {submitError && <div role="alert" className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{submitError}</div>}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên dự án <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder="VD: Nâng cấp cổng thông tin khách hàng"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.name && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả mục tiêu</label>
            <textarea
              rows={2}
              {...register('description')}
              placeholder="Mô tả mục tiêu chiến lược và kết quả kỳ vọng..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {errors.description && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.description.message}</p>}
          </div>

          {!initialProject && (
            <section className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white"><Sparkles className="h-4 w-4" /></div>
                <div><h4 className="text-xs font-bold text-slate-800">Trợ lý AI lập kế hoạch</h4><p className="mt-1 text-[11px] leading-5 text-slate-500">Tải tài liệu PDF/Word hoặc mô tả yêu cầu để AI đề xuất task, thời lượng, vai trò và rủi ro. Kết quả là bản nháp, không tự tạo task hay phân công.</p></div>
              </div>
              <label className="block text-xs font-semibold text-slate-700">
                Mô tả chi tiết từ người tạo
                <textarea value={aiDescription} onChange={(event) => setAiDescription(event.target.value)} rows={3} maxLength={10000} placeholder="Bổ sung phạm vi, người dùng, yêu cầu, hệ thống cần tích hợp và tiêu chí nghiệm thu..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 outline-none focus:border-violet-400" />
              </label>
              <label htmlFor="project-plan-document" className={`flex items-center gap-2 rounded-xl border border-dashed px-3 py-3 text-xs font-semibold ${isReadingDocument ? 'cursor-wait border-slate-200 bg-slate-100 text-slate-500' : 'cursor-pointer border-violet-200 bg-white text-slate-600 hover:bg-violet-50'}`}>
                <Upload className="h-4 w-4 text-violet-600" />
                <span className="min-w-0 flex-1 truncate">{documentName || 'Tải tài liệu chi tiết (PDF, DOCX, TXT · tối đa 10 MB)'}</span>
                <input id="project-plan-document" type="file" accept=".pdf,.docx,.txt,application/pdf,text/plain" className="hidden" disabled={isReadingDocument || isGeneratingPlan} onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = '';
                  void readProjectDocument(file);
                }} />
              </label>
              {documentStatus && <p role="status" className="text-[10px] text-slate-500">{documentStatus}</p>}
              <p className="text-[10px] leading-4 text-slate-400">Tài liệu được trích xuất trên trình duyệt; khi bấm tạo kế hoạch, nội dung mô tả và tối đa 16.000 ký tự đầu của tài liệu sẽ gửi đến dịch vụ AI đã cấu hình.</p>
              <button type="button" onClick={generateProjectPlan} disabled={!projectName?.trim() || (!aiDescription.trim() && !projectDescription.trim() && !documentText.trim()) || isGeneratingPlan || isReadingDocument} className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40">
                {isGeneratingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                {isGeneratingPlan ? 'Đang phân tích...' : 'Tạo gợi ý bằng AI'}
              </button>
              {aiError && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">{aiError}</div>}
              {plan && (
                <div className="space-y-3 rounded-xl border border-violet-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3"><div><h5 className="text-sm font-bold text-slate-800">{plan.projectName}</h5><p className="mt-1 text-xs leading-5 text-slate-600">{plan.executiveSummary}</p></div><span className="shrink-0 rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-800">AI Draft</span></div>
                  <div className="flex flex-wrap gap-2 text-[10px]"><span className="rounded-lg bg-blue-50 px-2 py-1 text-blue-700"><Clock3 className="mr-1 inline h-3 w-3" />{plan.estimatedTotalDays || '—'} ngày dự kiến</span><span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">{plan.suggestedTasks.length} task gợi ý</span></div>
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {plan.suggestedTasks.map((task, index) => {
                      const suggestedMembers = task.suggestedRole ? suggestMembersForRole(task.suggestedRole) : [];
                      return <article key={`${task.title}-${index}`} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-start gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h6 className="text-xs font-bold text-slate-800">{task.title}</h6>{task.priority && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] text-slate-600">{task.priority}</span>}</div>{task.description && <p className="mt-1 text-[10px] leading-4 text-slate-500">{task.description}</p>}
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">{task.estimatedDays ? <span>{task.estimatedDays} ngày</span> : null}{task.suggestedRole ? <span>Vai trò/chuyên môn: {task.suggestedRole}</span> : null}</div>
                          {task.suggestedRole && <p className="mt-2 text-[10px] text-violet-700">Ứng viên khớp hồ sơ: {suggestedMembers.length ? suggestedMembers.map((user) => user.full_name || user.name).join(', ') : 'Chưa tìm thấy; cần rà soát thủ công'}</p>}
                          {(task.dependencyTaskTitles?.length ?? 0) > 0 && <p className="mt-1 text-[10px] text-slate-400">Phụ thuộc: {task.dependencyTaskTitles?.join(', ')}</p>}
                        </div></div>
                      </article>;
                    })}
                    {!plan.suggestedTasks.length && <p className="py-4 text-center text-xs text-slate-400">AI chưa trả về task đề xuất.</p>}
                  </div>
                  {plan.potentialRisks.length > 0 && <div className="rounded-xl bg-amber-50 p-3 text-[10px] text-amber-800"><div className="mb-1 flex items-center gap-1 font-bold"><AlertTriangle className="h-3 w-3" />Rủi ro cần rà soát</div>{plan.potentialRisks.join(' · ')}</div>}
                  <p className="flex items-center gap-1 text-[10px] text-slate-400"><FileText className="h-3 w-3" />Ứng viên được đối chiếu cục bộ từ hồ sơ chuyên môn, tên nhân sự không gửi cho AI.</p>
                </div>
              )}
            </section>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phòng ban phụ trách <span className="text-red-500">*</span>
              </label>
              <select
                {...register('departmentId')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              {errors.departmentId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.departmentId.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Manager (PM) <span className="text-red-500">*</span>
              </label>
              <select
                {...register('pmId')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">-- Chỉ định PM --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              {errors.pmId && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.pmId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('startDate')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.startDate && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.startDate.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('endDate')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.endDate && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition"
            >
              {isPage ? 'Quay lại danh sách' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang lưu...
                </>
              ) : initialProject ? (
                'Lưu thay đổi'
              ) : (
                'Tạo dự án'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
