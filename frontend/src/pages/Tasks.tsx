import React, { useEffect, useState } from 'react';
import { Filter, Plus, Search, Settings, X } from 'lucide-react';
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

interface Project {
  id: string;
  name: string;
}

const Tasks: React.FC = () => {
  const { user } = useAuthStore();

  const [view, setView] = useState<'board' | 'list'>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<Task['status']>('TODO');
  const [newProgress, setNewProgress] = useState<number>(0);

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');

  const statuses: Task['status'][] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.data || []);
    } catch (error) {
      console.error('Error fetching projects', error);
    }
  };

  useEffect(() => {
    void fetchTasks();
    void fetchProjects();
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
        progress: newProgress,
      });
      setSelectedTask(null);
      await fetchTasks();
    } catch (error) {
      console.error('Failed to update task', error);
      alert('Failed to update task. Ensure you have permission.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const selectedProject = newTaskProject || (projects.length > 0 ? projects[0].id : undefined);

      if (!selectedProject) {
        alert('Please create a Project first before creating a task!');
        return;
      }

      await api.post('/tasks', {
        title: newTaskTitle,
        description: newTaskDesc,
        due_date: newTaskDueDate,
        project_id: selectedProject,
      });

      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDueDate('');
      setNewTaskProject('');
      await fetchTasks();
    } catch (error) {
      console.error('Failed to create task', error);
      alert('Failed to create task. Check if you have permissions and valid project ID.');
    }
  };

  const statusLabel = (status: Task['status']) => {
    switch (status) {
      case 'TODO':
        return 'To Do';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'IN_REVIEW':
        return 'In Review';
      case 'DONE':
        return 'Done';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
          <p className="text-sm text-gray-500">Track project workload and execution progress</p>
        </div>

        <div className="flex items-center space-x-3">
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center bg-[#4318FF] text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm"
            >
              <Plus size={16} className="mr-2" />
              Add task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mr-4">
            <span className="text-red-500 font-bold text-lg">!</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overdue</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {tasks.filter((t) => new Date(t.due_date) < new Date() && t.status !== 'DONE').length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center mr-4">
            <span className="text-orange-500 font-bold text-lg">⏱</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Upcoming</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
            </h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4">
            <span className="text-blue-500 font-bold text-lg">✓</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total</p>
            <h3 className="text-2xl font-bold text-gray-800">{tasks.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-xl bg-[#4318FF] text-white flex items-center justify-center mr-4 shadow-md">
            <Settings size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Auto reminder</h3>
            <p className="text-xs text-gray-500 mt-1">Setup reminder schedule for tasks reaching deadline.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
          <span className="text-xs font-semibold text-gray-700">Reminder time:</span>
          <div className="flex space-x-2">
            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">08:00</span>
            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 font-medium">17:00</span>
          </div>
          <button className="bg-[#4318FF] text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">
            Save
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setView('board')}
            className={'py-2 px-1 border-b-2 font-medium text-sm ' + (view === 'board' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
          >
            Kanban Board
          </button>
          <button
            onClick={() => setView('list')}
            className={'py-2 px-1 border-b-2 font-medium text-sm ' + (view === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
          >
            List View
          </button>
        </nav>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-[#4318FF] focus:border-[#4318FF] outline-none text-sm transition-all"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
        <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none text-gray-600 bg-white min-w-[130px] font-medium">
          <option>Project</option>
        </select>
        <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none text-gray-600 bg-white min-w-[130px] font-medium">
          <option>Assignee</option>
        </select>
        <button className="inline-flex items-center border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 bg-white hover:bg-gray-50">
          <Filter size={15} className="mr-2" />
          Filters
        </button>
      </div>

      {view === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4">
          {statuses.map((status) => (
            <div key={status} className="bg-gray-100 rounded-xl p-4 min-h-[500px]">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                {statusLabel(status)}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {tasks.filter((t) => t.status === status).length}
                </span>
              </h3>

              <div className="space-y-3">
                {tasks
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                      <p className="text-xs text-gray-500 mb-2 truncate">{task.project?.name || 'No project'}</p>

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
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-[#f8f9fa]">
                <tr>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.project?.name || '---'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignee?.full_name || 'Unassigned'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {statusLabel(task.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${task.progress}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.due_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  onChange={(e) => setNewStatus(e.target.value as Task['status'])}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress: {newProgress}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={newProgress}
                  onChange={(e) => setNewProgress(parseInt(e.target.value, 10))}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setSelectedTask(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <button type="button" onClick={() => setIsNewTaskModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
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
