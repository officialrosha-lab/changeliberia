'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface Institution {
  id: string;
  name: string;
  type: string;
  category: string;
  officialEmail: string;
  phone: string | null;
  verified: boolean;
  description: string | null;
  createdAt: string;
  _count?: {
    departments: number;
    contacts: number;
  };
}

interface Department {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string | null;
}

export function InstitutionsManager() {
  const token = useAuthStore((s) => s.token);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'GOVERNMENT',
    category: 'AGENCY',
    officialEmail: '',
    phone: '',
    description: '',
  });

  useEffect(() => {
    if (!token) return;
    loadInstitutions();
  }, [token]);

  async function loadInstitutions() {
    try {
      setLoading(true);
      const data = await apiGet<Institution[]>('/admin/directory/institutions', token!);
      setInstitutions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load institutions');
    } finally {
      setLoading(false);
    }
  }

  async function loadDepartments(institutionId: string) {
    try {
      const data = await apiGet<Department[]>(
        `/admin/directory/institutions/${institutionId}/departments`,
        token!
      );
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  async function handleSelectInstitution(id: string) {
    setSelectedId(id);
    await loadDepartments(id);
  }

  async function handleCreateInstitution() {
    if (!token) return;
    try {
      await apiPost('/admin/directory/institutions', formData, token);
      setFormData({
        name: '',
        type: 'GOVERNMENT',
        category: 'AGENCY',
        officialEmail: '',
        phone: '',
        description: '',
      });
      setShowForm(false);
      await loadInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create institution');
    }
  }

  async function handleVerify(institutionId: string) {
    if (!token) return;
    try {
      await apiPost(`/admin/directory/institutions/${institutionId}/verify`, {}, token);
      await loadInstitutions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify institution');
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading institutions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          {showForm ? 'Cancel' : 'Add Institution'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200">
          <h3 className="text-lg font-semibold mb-4">Add New Institution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Institution Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="GOVERNMENT">Government</option>
              <option value="NGO">NGO</option>
              <option value="PRIVATE">Private</option>
            </select>
            <input
              type="email"
              placeholder="Official Email"
              value={formData.officialEmail}
              onChange={(e) => setFormData({ ...formData, officialEmail: e.target.value })}
              className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
            />
          </div>
          <button
            onClick={handleCreateInstitution}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Create Institution
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Institutions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Name</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Contacts</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {institutions.map((inst) => (
              <tr key={inst.id} className="border-b border-zinc-200 hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{inst.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                    {inst.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">{inst.officialEmail}</td>
                <td className="px-4 py-3">
                  {inst.verified ? (
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {inst._count?.departments || 0} dept, {inst._count?.contacts || 0} contacts
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    onClick={() => handleSelectInstitution(inst.id)}
                    className="text-emerald-600 hover:underline font-medium"
                  >
                    View
                  </button>
                  {!inst.verified && (
                    <button
                      onClick={() => handleVerify(inst.id)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Departments for Selected Institution */}
      {selectedId && departments.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-3">Departments</h3>
          <div className="space-y-2">
            {departments.map((dept) => (
              <div key={dept.id} className="flex justify-between items-center p-2 bg-white rounded">
                <div>
                  <p className="font-medium">{dept.name}</p>
                  <p className="text-sm text-zinc-600">{dept.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
