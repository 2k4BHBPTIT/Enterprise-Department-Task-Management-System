import React from 'react';
import { Plus, Building2, Users } from 'lucide-react';

const Departments: React.FC = () => {
  const mockDepartments = [
    { id: 1, name: 'Engineering', manager: 'Alice Smith', employees: 24, projects: 5 },
    { id: 2, name: 'Marketing', manager: 'Bob Jones', employees: 12, projects: 3 },
    { id: 3, name: 'Human Resources', manager: 'Carol White', employees: 5, projects: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} className="mr-2" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDepartments.map(dept => (
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
                <span className="font-medium text-gray-900">{dept.manager}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Projects:</span>
                <span className="font-medium text-gray-900">{dept.projects}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center text-gray-500 text-sm">
                <Users size={16} className="mr-1" />
                <span>{dept.employees} members</span>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Departments;
