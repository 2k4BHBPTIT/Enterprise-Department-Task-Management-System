import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { taskApi } from '../../services/api/task.api';
import { projectApi } from '../../services/api/project.api';
import { Project, Task } from '../../types';

export const GanttView: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('0');
  const [hoveredTaskId, setHoveredTaskId] = useState<string | number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsLoading(true);
    Promise.all([projectApi.getProjects(), taskApi.getTasks()])
      .then(([projectData, taskData]) => {
        setProjects(projectData);
        setTasks(taskData);
        setSelectedProjectId((currentId) =>
          projectData.some((project) => String(project.id) === currentId)
            ? currentId
            : projectData[0]
              ? String(projectData[0].id)
              : '0'
        );
        setError('');
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu Gantt');
      })
      .finally(() => setIsLoading(false));
  }, []);
  const currentProject = projects.find((p) => String(p.id) === String(selectedProjectId)) || projects[0];
  const projectTasks = tasks.filter((t) => String(t.projectId) === String(selectedProjectId));

  const colors = ['#1D4ED8', '#DC2626', '#EA580C', '#16A34A', '#9333EA', '#D97706', '#0891B2', '#F97316'];

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl p-5 shadow-sm space-y-5">
      {/* Selector & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Gantt Chart theo dự án</h2>
          <p className="text-xs text-slate-400 mt-0.5">Chọn dự án hoặc click từ tab 'Dự án' để xem ngay Gantt toàn bộ công việc</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            aria-label="Chọn dự án để vẽ biểu đồ Gantt"
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.progressPercent}%)
              </option>
            ))}
          </select>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition">
            <BarChart3 className="w-3.5 h-3.5" />
            Vẽ Gantt
          </button>
        </div>
      </div>

      {/* Gantt Timeline Area */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">Đang tải dữ liệu Gantt...</div>
      ) : error ? (
        <div className="py-16 text-center text-xs text-red-600">{error}</div>
      ) : !currentProject ? (
        <div className="py-16 text-center text-xs text-slate-500">Chưa có dự án để hiển thị biểu đồ Gantt.</div>
      ) : (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800">
            Gantt: {currentProject.name}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
            {projectTasks.length} task
          </span>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="min-w-[700px] space-y-3">
            {/* Timeline scale header */}
            <div className="flex text-[10px] text-slate-400 font-medium pl-48 justify-between border-b border-slate-100 pb-2">
              <span>thg 1 24</span>
              <span>thg 1 28</span>
              <span>thg 2 1</span>
              <span>thg 2 5</span>
              <span>thg 2 9</span>
              <span>thg 2 13</span>
              <span>thg 2 17</span>
            </div>

            {/* Task rows */}
            {projectTasks.map((t, idx) => {
              const barColor = colors[idx % colors.length];
              const isHovered = hoveredTaskId === t.id;

              return (
                <div
                  key={t.id}
                  className="relative flex items-center group py-1 hover:bg-slate-50/60 rounded-xl px-2 transition"
                  onMouseEnter={() => setHoveredTaskId(t.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                >
                  {/* Task Title */}
                  <div className="w-44 text-xs font-semibold text-slate-700 truncate pr-3" style={{ color: barColor }}>
                    {t.title}
                  </div>

                  {/* Gantt Bar representation */}
                  <div className="flex-1 relative h-6 bg-slate-100 rounded-lg overflow-visible">
                    <div
                      className="absolute top-1 bottom-1 rounded-md transition-all duration-300 shadow-sm flex items-center px-2 cursor-pointer"
                      style={{
                        left: `${(idx * 8 + 5) % 40}%`,
                        width: `${Math.max(35, 75 - idx * 6)}%`,
                        backgroundColor: barColor,
                      }}
                    >
                      <span className="text-[10px] font-bold text-white truncate drop-shadow-sm">
                        {t.progressPercent}%
                      </span>
                    </div>

                    {/* Popover / Tooltip */}
                    {isHovered && (
                      <div className="absolute top-8 left-1/3 z-20 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl text-xs w-64">
                        <div className="font-bold text-slate-800 mb-1">{t.title}</div>
                        <div className="flex justify-between text-slate-500 text-[11px] py-0.5">
                          <span>Thời lượng:</span>
                          <span className="font-semibold text-slate-700">19 ngày</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px] py-0.5">
                          <span>Tiến độ:</span>
                          <span className="font-semibold text-emerald-600">{t.progressPercent}%</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px] py-0.5">
                          <span>Phụ trách:</span>
                          <span className="font-semibold text-blue-600">{t.assigneeName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
