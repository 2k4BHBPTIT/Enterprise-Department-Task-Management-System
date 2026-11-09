import React, { useEffect, useMemo, useState } from 'react';
import { Bot, FileText, Layers3, Sparkles, Upload } from 'lucide-react';
import { Project } from '../../types';
import { projectApi } from '../../services/api/project.api';
import { aiApi, AiPlanItem } from '../../services/api/ai.api';

type PlanItem = AiPlanItem;

const basePlan: PlanItem[] = [
  { title: 'Làm rõ phạm vi và yêu cầu', phase: 'Khởi tạo', duration: '2-3 ngày', output: 'Bản đặc tả phạm vi, yêu cầu và tiêu chí nghiệm thu' },
  { title: 'Phân tích hiện trạng và rủi ro', phase: 'Khảo sát', duration: '3-5 ngày', output: 'Bản phân tích hiện trạng, rủi ro và phụ thuộc' },
  { title: 'Thiết kế giải pháp và dữ liệu', phase: 'Thiết kế', duration: '4-7 ngày', output: 'Thiết kế kiến trúc, quy trình và dữ liệu' },
  { title: 'Triển khai theo từng module', phase: 'Thực hiện', duration: 'Tùy quy mô', output: 'Sản phẩm module và tài liệu kỹ thuật' },
  { title: 'Kiểm thử tích hợp và UAT', phase: 'Kiểm thử', duration: '3-5 ngày', output: 'Biên bản kiểm thử và xử lý lỗi' },
  { title: 'Triển khai, đào tạo và bàn giao', phase: 'Bàn giao', duration: '2-4 ngày', output: 'Hướng dẫn sử dụng và tài liệu bàn giao' },
];

export const ProjectDigitization: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('NEW');
  const [description, setDescription] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    projectApi.getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === projectId),
    [projects, projectId],
  );

  const generatePlan = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setAiError('');
    try {
      const generatedPlan = await aiApi.generateProjectPlan({
        description: description.trim(),
        projectName: selectedProject?.name,
        documentName: documentName || undefined,
        documentContent: documentContent || undefined,
      });
      setPlan(generatedPlan);
    } catch (error) {
      const lower = description.toLowerCase();
      const extra: PlanItem[] = [];
      if (/ai|machine learning|trí tuệ|chatbot/.test(lower)) {
        extra.push({ title: 'Xây dựng luồng dữ liệu và mô hình AI', phase: 'AI/Data', duration: '7-10 ngày', output: 'Pipeline dữ liệu và mô hình AI đã huấn luyện' });
      }
      if (/mobile|ứng dụng di động/.test(lower)) {
        extra.push({ title: 'Phát triển ứng dụng di động', phase: 'Mobile', duration: '10-15 ngày', output: 'Ứng dụng Android/iOS và tài liệu build' });
      }
      if (/web|website|portal/.test(lower)) {
        extra.push({ title: 'Xây dựng giao diện và API web', phase: 'Web', duration: '10-15 ngày', output: 'Ứng dụng web và API đã tích hợp' });
      }
      if (/báo cáo|dashboard|thống kê/.test(lower)) {
        extra.push({ title: 'Thiết kế dashboard và báo cáo', phase: 'Analytics', duration: '5-7 ngày', output: 'Dashboard, biểu đồ và báo cáo định kỳ' });
      }
      setPlan([...basePlan.slice(0, 3), ...extra, ...basePlan.slice(3)]);
      setAiError(error instanceof Error ? `${error.message} Đang hiển thị kế hoạch dự phòng.` : 'Không gọi được AI. Đang hiển thị kế hoạch dự phòng.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadProjectDescription = (id: string) => {
    setProjectId(id);
    const project = projects.find((item) => String(item.id) === id);
    if (project) setDescription(project.description || project.name);
    if (id === 'NEW') setDescription('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-white to-violet-50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Số hóa dự án và lập kế hoạch bằng AI</h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Nhập mô tả ý tưởng hoặc tải tài liệu để tạo bộ đầu việc, giai đoạn, thời lượng và đầu ra dự kiến.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <label className="text-xs font-semibold text-slate-700">Dự án đầu vào</label>
          <select value={projectId} onChange={(event) => loadProjectDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs">
            <option value="NEW">Dự án mới — tạo plan từ mô tả</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>

          <label className="mt-4 block text-xs font-semibold text-slate-700">Mô tả dự án <span className="text-red-500">*</span></label>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={9} placeholder="Ví dụ: Xây dựng hệ thống quản lý kho web, có dashboard tồn kho, cảnh báo tồn thấp, tích hợp mã vạch và phân quyền nhân viên..." className="mt-2 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 outline-none focus:border-violet-400" />

          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-xs font-semibold text-slate-600">
            <Upload className="h-4 w-4 text-violet-600" />
            <span>{documentName || 'Tải tài liệu mô tả: PDF, DOCX, TXT, XLSX'}</span>
            <input type="file" accept=".pdf,.doc,.docx,.txt,.xlsx" className="hidden" onChange={async (event) => {
              const file = event.target.files?.[0];
              setDocumentName(file?.name || '');
              if (file?.name.toLowerCase().endsWith('.txt')) {
                setDocumentContent(await file.text());
              } else {
                setDocumentContent('');
              }
            }} />
          </label>

          <button type="button" onClick={generatePlan} disabled={!description.trim() || isGenerating} className="mt-4 flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">
            <Bot className="h-4 w-4" />{isGenerating ? 'Đang phân tích...' : 'Tự động tạo plan công việc'}
          </button>
          {aiError && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">{aiError}</div>}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2"><Layers3 className="h-4 w-4 text-violet-600" /><h3 className="text-sm font-bold text-slate-800">Thông tin phân tích</h3></div>
          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400">Nguồn mô tả</div><div className="mt-1 font-semibold text-slate-700">{selectedProject?.name || 'Ý tưởng dự án mới'}</div></div>
            <div className="rounded-2xl bg-slate-50 p-3"><div className="text-[10px] text-slate-400">Tài liệu đã tải</div><div className="mt-1 font-semibold text-slate-700">{documentName || 'Chưa có tài liệu'}</div></div>
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">Mô hình AI backend có thể thay thế quy tắc phân tích demo bằng OCR + phân tích ngữ nghĩa thực tế.</div>
          </div>
        </div>
      </div>

      {plan.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-800">Kế hoạch công việc đề xuất</h3><p className="mt-1 text-[11px] text-slate-400">{plan.length} đầu việc được sinh từ mô tả dự án</p></div><span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">AI Draft</span></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {plan.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-[11px] font-bold text-white">{index + 1}</span><div><div className="text-xs font-bold text-slate-800">{item.title}</div><div className="mt-1 text-[10px] text-violet-600">{item.phase} • {item.duration}</div></div></div>
                <div className="mt-3 flex gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span><b>Đầu ra:</b> {item.output}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
