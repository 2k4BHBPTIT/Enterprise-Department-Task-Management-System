import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
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
  const [view, setView] = useState<'board' | 'list'>('board');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState<Task['status']>('TODO');
  const [newProgress, setNewProgress] = useState<number>(0);

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

  useEffect(() => {
    fetchTasks();
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

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real app we would select the project id and assignee id. We mock it for the UI for now.
      const firstProject = tasks.find(t => t.project)?.project_id || 'some-project-id';
      await api.post('/tasks', {
        title: newTaskTitle,
        description: newTaskDesc,
        due_date: newTaskDueDate,
        project_id: firstProject, // Ideally, we'd have a project selector
      });
      setIsNewTaskModalOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to create task', error);
      alert('Failed to create task. Check if you have permissions and valid project ID.');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading tasks...</div>;

  const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Tasks Management</h1>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
            <Filter size={18} />
          </button>
          {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              <Plus size={16} className="mr-2" />
              New Task
            </button>
          )}
        </div>
      </div>

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
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
