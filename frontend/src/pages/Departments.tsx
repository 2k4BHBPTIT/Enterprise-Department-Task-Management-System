import React, { useEffect, useState } from 'react';
import { Plus, Building2, Users } from 'lucide-react';
import api from '../api/axios';

interface Employee {
  id: string;
  full_name: string;
}

interface Department {
  id: string;
  name: string;
  manager: Employee | null;
  _count: {
    employees: number;
    projects: number;
  };
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Error fetching departments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    try {
      await api.post('/departments', { name: newDeptName });
      setNewDeptName('');
      setIsModalOpen(false);
      fetchDepartments(); // Refresh list
    } catch (error) {
      console.error('Failed to create department', error);
      alert('Failed to create department');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading departments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} className="mr-2" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                  <Building2 size={24} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{dept.name}</h2>
              </div>
            </div>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Manager:</span>
                <span className="font-medium text-gray-900">{dept.manager?.full_name || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Projects:</span>
                <span className="font-medium text-gray-900">{dept._count.projects}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center text-gray-500 text-sm">
                <Users size={16} className="mr-1" />
                <span>{dept._count.employees} members</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Department</h2>
            <form onSubmit={handleCreateDepartment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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

export default Departments;
