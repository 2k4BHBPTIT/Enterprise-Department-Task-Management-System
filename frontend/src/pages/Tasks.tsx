import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { Plus, Search, Filter, X } from 'lucide-react';
=======
import { Plus, Search, X, Settings } from 'lucide-react';
>>>>>>> 7217b8d (Update frontend management workflows)
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/axios';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'CANCELLED';
  progress: number;
  due_date: string;
  project_id: string;
  assignee?: { full_name: string };
  project?: { name: string };
}

const Tasks: React.FC = () => {
  const { user } = useAuthStore();
<<<<<<< HEAD
  const [view, setView] = useState<'board' | 'list'>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

=======

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

>>>>>>> 7217b8d (Update frontend management workflows)
  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<Task['status']>('TODO');
  const [newProgress, setNewProgress] = useState<number>(0);

<<<<<<< HEAD
=======
  // Projects state for New Task modal
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);

>>>>>>> 7217b8d (Update frontend management workflows)
  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error fetching tasks', error);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    fetchTasks();
=======
  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data);
    } catch (error) {
      console.error('Error fetching projects', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
>>>>>>> 7217b8d (Update frontend management workflows)
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setNewProgress(task.progress);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      await api.put(`/tasks/${selectedTask.id}`, {
        status: newStatus,
        progress: newProgress
      });
      setSelectedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task', error);
      alert('Failed to update task. Ensure you have permission.');
    }
  };

  // Create Task states
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
<<<<<<< HEAD
=======
  const [newTaskProject, setNewTaskProject] = useState('');
>>>>>>> 7217b8d (Update frontend management workflows)

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
<<<<<<< HEAD
      // In a real app we would select the project id and assignee id. We mock it for the UI for now.
      const firstProject = tasks.find(t => t.project)?.project_id || 'some-project-id';
=======
      const selectedProject = newTaskProject || (projects.length > 0 ? projects[0].id : undefined);
      
      if (!selectedProject) {
        alert("Please create a Project first before creating a task!");
        return;
      }

>>>>>>> 7217b8d (Update frontend management workflows)
      await api.post('/tasks', {
        title: newTaskTitle,
        description: newTaskDesc,
        due_date: newTaskDueDate,
<<<<<<< HEAD
        project_id: firstProject, // Ideally, we'd have a project selector
      });
      setIsNewTaskModalOpen(false);
=======
        project_id: selectedProject,
      });
      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate('');
>>>>>>> 7217b8d (Update frontend management workflows)
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task', error);
      alert('Failed to create task. Check if you have permissions and valid project ID.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading tasks...</div>;

<<<<<<< HEAD
  const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
=======

>>>>>>> 7217b8d (Update frontend management workflows)

  return (
    <div className="space-y-6">
      {/* Page Title & Search/Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nhắc việc</h1>
          <p className="text-sm text-gray-500">Gửi nhắc nhở công việc sắp đến hạn hoặc quá hạn</p>
        </div>
        <div className="flex items-center space-x-3">
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
<<<<<<< HEAD
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
=======
              className="flex items-center bg-[#4318FF] text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm"
>>>>>>> 7217b8d (Update frontend management workflows)
            >
              <Plus size={16} className="mr-2" />
              Thêm công việc
            </button>
          )}
        </div>
      </div>

<<<<<<< HEAD
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setView('board')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${view === 'board' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setView('list')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${view === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            List View
          </button>
        </nav>
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
          {statuses.map((status) => (
            <div key={status} className="bg-gray-100 rounded-xl p-4 min-h-[500px]">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                {status.replace('_', ' ')}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </h3>
              <div className="space-y-3">
                {tasks.filter(t => t.status === status).map(task => (
                  <div key={task.id} onClick={() => handleTaskClick(task)} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
                    <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                    <p className="text-xs text-gray-500 mb-2 truncate">{task.project?.name}</p>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-gray-500 flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-2 font-bold" title={task.assignee?.full_name || 'Unassigned'}>
                          {task.assignee?.full_name ? task.assignee.full_name.charAt(0) : '?'}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
=======
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mr-4">
            <span className="text-red-500 font-bold text-lg">!</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Quá hạn</p>
            <h3 className="text-2xl font-bold text-gray-800">{tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'DONE').length}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mr-4">
            <span className="text-orange-500 font-bold text-lg">⏱</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Sắp đến hạn</p>
            <h3 className="text-2xl font-bold text-gray-800">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</h3>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
            <span className="text-blue-500 font-bold text-lg">✓</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Có thể gửi</p>
            <h3 className="text-2xl font-bold text-gray-800">{tasks.length}</h3>
          </div>
        </div>
      </div>

      {/* Settings Banner (Gửi tự động) */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-[#4318FF] text-white flex items-center justify-center mr-4 shadow-md">
            <Settings size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Gửi tự động</h3>
            <p className="text-xs text-gray-500 mt-1">Chọn các khung giờ cố định. Hệ thống sẽ tự động nhắc qua hạn hoặc sắp đến hạn sau 2 ngày.</p>
          </div>
>>>>>>> 7217b8d (Update frontend management workflows)
        </div>
        <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
          <span className="text-xs font-semibold text-gray-700">Gửi nhắc tự động lúc:</span>
          <div className="flex space-x-2">
            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">08:00</span>
            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">17:00</span>
          </div>
          <button className="bg-[#4318FF] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">
            Lưu cài đặt
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-white p-4 rounded-t-xl border border-gray-100 border-b-0 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Tìm công việc cần nhắc..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#4318FF] focus:border-[#4318FF] outline-none text-sm transition-all"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
        <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none text-gray-600 bg-white min-w-[130px] font-medium">
          <option>Dự án ▾</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none text-gray-600 bg-white min-w-[130px] font-medium">
          <option>Người nhận ▾</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none text-gray-600 bg-white min-w-[140px] font-medium">
          <option>Tình trạng hạn ▾</option>
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-gray-100 rounded-b-xl shadow-sm overflow-hidden -mt-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-[#f8f9fa]">
              <tr>
<<<<<<< HEAD
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} onClick={() => handleTaskClick(task)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.project?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.assignee?.full_name || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.progress}%` }}></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.due_date).toLocaleDateString()}
=======
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Công việc / Dự án</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Người nhận</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Hạn hoàn thành</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Tình trạng</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Gửi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    Chưa có công việc nào.
>>>>>>> 7217b8d (Update frontend management workflows)
                  </td>
                </tr>
              ) : tasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'DONE';
                return (
                  <tr key={task.id} onClick={() => handleTaskClick(task)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-800">{task.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{task.project?.name || '---'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-[#4318FF] flex items-center justify-center text-xs font-bold mr-3 border border-indigo-200">
                          {task.assignee?.full_name ? task.assignee.full_name.charAt(0) : '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{task.assignee?.full_name || 'Chưa giao'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                      <span className={isOverdue ? 'text-red-500' : 'text-gray-700'}>
                        {new Date(task.due_date).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {isOverdue ? (
                        <span className="px-3 py-1 inline-flex text-[11px] font-bold rounded-full bg-red-50 text-red-600 border border-red-100">
                          Quá hạn
                        </span>
                      ) : (
                        <span className={`px-3 py-1 inline-flex text-[11px] font-bold rounded-full border ${task.status === 'DONE' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-[#4318FF] border-blue-100'}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button className="bg-[#4318FF] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 inline-flex items-center shadow-sm opacity-90 group-hover:opacity-100 transition-opacity">
                        ▶ Gửi
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Update Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Update Task</h2>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900">{selectedTask.title}</h3>
              <p className="text-sm text-gray-500">{selectedTask.description || 'No description'}</p>
            </div>

            <form onSubmit={handleUpdateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress: {newProgress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value))}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Project</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTaskProject}
                  onChange={(e) => setNewTaskProject(e.target.value)}
                >
                  <option value="" disabled>Select a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Update Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Update Task</h2>
              <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900">{selectedTask.title}</h3>
              <p className="text-sm text-gray-500">{selectedTask.description || 'No description'}</p>
            </div>

            <form onSubmit={handleUpdateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress: {newProgress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value))}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
