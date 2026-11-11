import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, Clock3, FileText, Layers3, ListChecks, Sparkles, Upload, Users } from 'lucide-react';
import { Project } from '../../types';
import { projectApi } from '../../services/api/project.api';
import { AiProjectPlan, aiApi } from '../../services/api/ai.api';

const fallbackPlan = (projectName: string, description: string): AiProjectPlan => {
  const lower = description.toLowerCase();
  const suggestedTasks = [
    { title: 'Thu thập và xác nhận yêu cầu', description: 'Làm rõ phạm vi, người dùng, yêu cầu chức năng và tiêu chí nghiệm thu.', priority: 'HIGH', estimatedDays: 3, suggestedRole: 'Business Analyst', dependencyTaskTitles: [] },
    { title: 'Thiết kế giải pháp và kiến trúc', description: 'Thiết kế kiến trúc, luồng nghiệp vụ, dữ liệu và phương án tích hợp.', priority: 'HIGH', estimatedDays: 5, suggestedRole: 'Solution Architect', dependencyTaskTitles: ['Thu thập và xác nhận yêu cầu'] },
    { title: 'Xây dựng và tích hợp sản phẩm', description: 'Phát triển theo module, rà soát mã nguồn và tích hợp các thành phần.', priority: 'HIGH', estimatedDays: 10, suggestedRole: 'Developer', dependencyTaskTitles: ['Thiết kế giải pháp và kiến trúc'] },
    { title: 'Kiểm thử và nghiệm thu', description: 'Kiểm thử chức năng, xử lý lỗi và xác nhận kết quả với người dùng.', priority: 'MEDIUM', estimatedDays: 5, suggestedRole: 'QA Engineer', dependencyTaskTitles: ['Xây dựng và tích hợp sản phẩm'] },
    { title: 'Triển khai và bàn giao', description: 'Chuẩn bị môi trường, hướng dẫn người dùng và bàn giao tài liệu vận hành.', priority: 'MEDIUM', estimatedDays: 2, suggestedRole: 'Project Manager', dependencyTaskTitles: ['Kiểm thử và nghiệm thu'] },
  ];
  if (/ai|machine learning|trí tuệ|chatbot/.test(lower)) {
    suggestedTasks.splice(2, 0, { title: 'Chuẩn bị dữ liệu và tích hợp AI', description: 'Xác định nguồn dữ liệu, thiết lập pipeline và tích hợp mô hình AI phù hợp.', priority: 'HIGH', estimatedDays: 7, suggestedRole: 'AI Engineer', dependencyTaskTitles: ['Thiết kế giải pháp và kiến trúc'] });
  }
  return {
    projectName,
    executiveSummary: 'Đây là kế hoạch tham khảo dự phòng do chưa nhận được kế hoạch chi tiết từ dịch vụ AI. Vui lòng rà soát và điều chỉnh theo phạm vi thực tế.',
    estimatedTotalDays: 25,
    phases: [
      { phaseName: 'Khởi tạo và phân tích', durationDays: 3, description: 'Xác định mục tiêu, phạm vi, yêu cầu và tiêu chí nghiệm thu.' },
      { phaseName: 'Thiết kế giải pháp', durationDays: 5, description: 'Hoàn thiện kiến trúc, thiết kế dữ liệu và kế hoạch triển khai.' },
      { phaseName: 'Phát triển và tích hợp', durationDays: 10, description: 'Xây dựng các module, kiểm tra mã nguồn và tích hợp hệ thống.' },
      { phaseName: 'Kiểm thử và bàn giao', durationDays: 7, description: 'Kiểm thử, nghiệm thu, triển khai và chuyển giao cho người dùng.' },
    ],
    suggestedTasks,
    recommendedRoles: ['Project Manager', 'Business Analyst', 'Developer', 'QA Engineer'],
    potentialRisks: ['Yêu cầu thay đổi trong quá trình triển khai có thể ảnh hưởng tiến độ.', 'Chưa xác nhận đầy đủ dữ liệu và phụ thuộc tích hợp trước khi phát triển.'],
  };
};

const parseList = (value: string) => value.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean);

const priorityStyle = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'URGENT':
      return 'bg-red-50 text-red-700';
    case 'HIGH':
      return 'bg-orange-50 text-orange-700';
    case 'LOW':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-amber-50 text-amber-700';
  }
};

export const ProjectDigitization: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('NEW');
  const [newProjectName, setNewProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [availableRoles, setAvailableRoles] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [plan, setPlan] = useState<AiProjectPlan | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    projectApi.getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === projectId),
    [projects, projectId],
  );

  const projectName = selectedProject?.name || newProjectName.trim();
  const generatePlan = async () => {
    if (!projectName || !description.trim()) return;
    setIsGenerating(true);
    setAiError('');
    setPlan(null);
    setIsFallback(false);
    try {
      const requestDescription = [
        description.trim(),
        documentContent.trim() ? `Nội dung tài liệu ${documentName}:\n${documentContent.trim()}` : '',
      ].filter(Boolean).join('\n\n');
      const generatedPlan = await aiApi.generateProjectPlan({
        projectName,
        description: requestDescription,
        ...(estimatedDuration ? { estimatedDurationDays: Number(estimatedDuration) } : {}),
        ...(parseList(deliverables).length ? { targetDeliverables: parseList(deliverables) } : {}),
        ...(parseList(availableRoles).length ? { availableRoles: parseList(availableRoles) } : {}),
      });
      setPlan(generatedPlan);
    } catch (error) {
      setPlan(fallbackPlan(projectName, description));
      setIsFallback(true);
      setAiError(error instanceof Error ? `${error.message} Đang hiển thị kế hoạch dự phòng.` : 'Không gọi được AI. Đang hiển thị kế hoạch dự phòng.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadProjectDescription = (id: string) => {
    setProjectId(id);
    const project = projects.find((item) => String(item.id) === id);
    if (project) {
      setDescription(project.description || project.name);
      setNewProjectName('');
    }
    if (id === 'NEW') {
      setDescription('');
    }
    setPlan(null);
    setAiError('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-white to-violet-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Lập kế hoạch dự án chi tiết bằng AI</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Cung cấp mục tiêu, thời lượng, đầu ra và nhân sự sẵn có để AI đề xuất giai đoạn, công việc, vai trò và rủi ro sát thực tế hơn.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <label htmlFor="plan-project-select" className="text-xs font-semibold text-slate-700">Dự án đầu vào</label>
          <select id="plan-project-select" value={projectId} onChange={(event) => loadProjectDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
            <option value="NEW">Dự án mới — tạo plan từ mô tả</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>

          {projectId === 'NEW' && (
            <label htmlFor="ai-project-name" className="mt-4 block text-xs font-semibold text-slate-700">
              Tên dự án <span className="text-red-500">*</span>
              <input id="ai-project-name" value={newProjectName} onChange={(event) => setNewProjectName(event.target.value)} required maxLength={200} placeholder="Nhập tên dự án" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-violet-400" />
            </label>
          )}

          <label htmlFor="plan-description" className="mt-4 block text-xs font-semibold text-slate-700">
            Mục tiêu và mô tả dự án <span className="text-red-500">*</span>
            <textarea id="plan-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={6} maxLength={10000} placeholder="Nêu vấn đề cần giải quyết, đối tượng sử dụng, phạm vi, chức năng chính, công nghệ hoặc hệ thống cần tích hợp..." className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 outline-none focus:border-violet-400" />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label htmlFor="plan-duration" className="text-xs font-semibold text-slate-700">
              Thời lượng dự kiến (ngày)
              <input id="plan-duration" type="number" min="1" max="3650" value={estimatedDuration} onChange={(event) => setEstimatedDuration(event.target.value)} placeholder="Ví dụ: 60" className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-violet-400" />
            </label>
            <label htmlFor="plan-roles" className="text-xs font-semibold text-slate-700">
              Vai trò có thể huy động
              <textarea id="plan-roles" value={availableRoles} onChange={(event) => setAvailableRoles(event.target.value)} rows={2} placeholder="PM, BA, Developer, QA..." className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs outline-none focus:border-violet-400" />
            </label>
          </div>

          <label htmlFor="plan-deliverables" className="mt-4 block text-xs font-semibold text-slate-700">
            Đầu ra mong muốn
            <textarea id="plan-deliverables" value={deliverables} onChange={(event) => setDeliverables(event.target.value)} rows={3} placeholder={'Mỗi đầu ra một dòng, ví dụ:\nWebsite quản lý\nTài liệu hướng dẫn\nBáo cáo nghiệm thu'} className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 outline-none focus:border-violet-400" />
          </label>

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-xs font-semibold text-slate-600">
            <Upload className="h-4 w-4 text-violet-600" />
            <span>{documentName || 'Đính kèm tài liệu mô tả dạng TXT'}</span>
            <input type="file" accept=".txt,text/plain" className="hidden" onChange={async (event) => {
              const file = event.target.files?.[0];
              setDocumentName(file?.name || '');
              setDocumentContent(file ? await file.text() : '');
            }} />
          </label>

          <button type="button" onClick={generatePlan} disabled={!projectName || !description.trim() || isGenerating} className="mt-4 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40">
            <Bot className="h-4 w-4" />{isGenerating ? 'AI đang phân tích yêu cầu...' : 'Tạo kế hoạch chi tiết bằng AI'}
          </button>
          {aiError && <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">{aiError}</div>}
        </div>

        <aside className="space-y-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-violet-600" /><h3 className="text-sm font-bold text-slate-800">Bối cảnh gửi cho AI</h3></div>
          <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400">Dự án</div><div className="mt-1 font-semibold text-slate-700">{projectName || 'Chưa nhập tên dự án'}</div></div>
          <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400">Thời lượng mục tiêu</div><div className="mt-1 font-semibold text-slate-700">{estimatedDuration ? `${estimatedDuration} ngày` : 'Để AI ước lượng'}</div></div>
          <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400">Đầu ra</div><div className="mt-1 font-semibold text-slate-700">{parseList(deliverables).length || 'Chưa chỉ định'}</div></div>
          <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400">Nhân sự / vai trò</div><div className="mt-1 font-semibold text-slate-700">{parseList(availableRoles).length || 'Để AI đề xuất'}</div></div>
          <div className="rounded-2xl bg-violet-50 p-3 text-[11px] leading-5 text-violet-700">Kết quả AI là bản đề xuất; hãy rà soát thời lượng, phụ thuộc và phân công trước khi áp dụng.</div>
        </aside>
      </div>

      {plan && (
        <div className="space-y-4">
          <section className="rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-violet-600" />
                  <h3 className="text-base font-bold text-slate-800">{plan.projectName}</h3>
                </div>
                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{plan.executiveSummary || 'Kế hoạch dự án được tạo từ yêu cầu và đầu vào đã cung cấp.'}</p>
              </div>
              <span className={`w-fit shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${isFallback ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-800'}`}>
                {isFallback ? 'Kế hoạch dự phòng' : 'AI Draft'}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"><Clock3 className="h-3.5 w-3.5" />Tổng thời lượng: {plan.estimatedTotalDays || '—'} ngày</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><ListChecks className="h-3.5 w-3.5" />{plan.suggestedTasks.length} đầu việc</span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"><Layers3 className="h-3.5 w-3.5" />{plan.phases.length} giai đoạn</span>
            </div>
            {plan.recommendedRoles.length > 0 && (
              <div className="mt-5">
                <h4 className="flex items-center gap-2 text-xs font-bold text-slate-700"><Users className="h-4 w-4 text-violet-600" />Vai trò đề xuất</h4>
                <div className="mt-2 flex flex-wrap gap-2">{plan.recommendedRoles.map((role) => <span key={role} className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600">{role}</span>)}</div>
              </div>
            )}
          </section>

          {plan.phases.length > 0 && (
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-sm font-bold text-slate-800">Lộ trình theo giai đoạn</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {plan.phases.map((phase, index) => (
                  <article key={`${phase.phaseName}-${index}`} className="relative rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-xs font-bold text-white">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{phase.phaseName}</h4>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{phase.durationDays} ngày</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{phase.description || 'Chưa có mô tả chi tiết.'}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {plan.suggestedTasks.length > 0 && (
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div><h3 className="text-sm font-bold text-slate-800">Danh sách đầu việc đề xuất</h3><p className="mt-1 text-[11px] text-slate-400">Thời lượng, mức ưu tiên, vai trò và phụ thuộc do AI phân tích</p></div>
                <span className="text-xs font-semibold text-violet-700">{plan.suggestedTasks.length} việc</span>
              </div>
              <div className="mt-4 space-y-3">
                {plan.suggestedTasks.map((task, index) => (
                  <article key={`${task.title}-${index}`} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold text-slate-600">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                          {task.priority && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityStyle(task.priority)}`}>{task.priority}</span>}
                        </div>
                        {task.description && <p className="mt-2 text-xs leading-5 text-slate-500">{task.description}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(task.estimatedDays ?? 0) > 0 && <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700"><Clock3 className="h-3 w-3" />{task.estimatedDays} ngày</span>}
                          {task.suggestedRole && <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-[10px] font-medium text-violet-700"><Users className="h-3 w-3" />{task.suggestedRole}</span>}
                        </div>
                        {(task.dependencyTaskTitles?.length ?? 0) > 0 && <p className="mt-2 text-[10px] text-slate-400">Phụ thuộc: {task.dependencyTaskTitles?.join(', ')}</p>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {plan.potentialRisks.length > 0 && (
            <section className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5 shadow-sm sm:p-6">
              <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900"><AlertTriangle className="h-4 w-4" />Rủi ro cần theo dõi</h3>
              <ul className="mt-3 space-y-2">
                {plan.potentialRisks.map((risk, index) => <li key={`${risk}-${index}`} className="flex gap-2 text-xs leading-5 text-amber-900"><span className="font-bold">{index + 1}.</span><span>{risk}</span></li>)}
              </ul>
            </section>
          )}

          {deliverables.trim() && (
            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800"><FileText className="h-4 w-4 text-emerald-600" />Đầu ra mong muốn</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {parseList(deliverables).map((deliverable, index) => <li key={`${deliverable}-${index}`} className="rounded-xl bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800">{deliverable}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
