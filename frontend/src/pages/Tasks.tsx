import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const Tasks: React.FC = () => {
  const { user } = useAuthStore();
  const [view, setView] = useState<'board' | 'list'>('board');

  const mockTasks = [
    { id: 1, title: 'Implement Login API', status: 'IN_PROGRESS', assignee: 'John Doe', priority: 'High', due: '2023-10-15' },
    { id: 2, title: 'Design Dashboard UI', status: 'TODO', assignee: 'Jane Smith', priority: 'Medium', due: '2023-10-18' },
    { id: 3, title: 'Database Schema Setup', status: 'DONE', assignee: 'Mike Johnson', priority: 'High', due: '2023-10-10' },
  ];

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
            <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus size={16} className="mr-2" />
              New Task
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
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
          {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((status) => (
            <div key={status} className="bg-gray-100 rounded-xl p-4 min-h-[500px]">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                {status.replace('_', ' ')}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {mockTasks.filter(t => t.status === status).length}
                </span>
              </h3>
              <div className="space-y-3">
                {mockTasks.filter(t => t.status === status).map(task => (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-xs text-gray-500 flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-2 font-bold">
                          {task.assignee.charAt(0)}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{task.due}</span>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{task.assignee}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.due}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Tasks;
