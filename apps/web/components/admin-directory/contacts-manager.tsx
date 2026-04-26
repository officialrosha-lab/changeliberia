'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { useAuthStore } from '../../lib/store';

interface Institution {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

interface ContactEntry {
  id: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  issueTags: string[];
  priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isPrimary: boolean;
  department?: { id: string; name: string } | null;
}

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export function ContactsManager() {
  const token = useAuthStore((s) => s.token);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editContactId, setEditContactId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    contactName: '',
    email: '',
    phone: '',
    issueTags: '',
    priorityLevel: 'MEDIUM',
    isPrimary: false,
    departmentId: '',
  });

  useEffect(() => {
    if (!token) return;
    void loadInstitutions();
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

  async function loadContacts(institutionId: string) {
    try {
      const data = await apiGet<ContactEntry[]>(
        `/admin/directory/institutions/${institutionId}/contacts`,
        token!,
      );
      setContacts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    }
  }

  async function loadDepartments(institutionId: string) {
    try {
      const data = await apiGet<Department[]>(
        `/admin/directory/institutions/${institutionId}/departments`,
        token!,
      );
      setDepartments(data || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  }

  async function handleSelectInstitution(institutionId: string) {
    setSelectedInstitutionId(institutionId);
    setError(null);
    setShowForm(false);
    setEditContactId(null);
    setFormData({
      contactName: '',
      email: '',
      phone: '',
      issueTags: '',
      priorityLevel: 'MEDIUM',
      isPrimary: false,
      departmentId: '',
    });
    if (institutionId) {
      await Promise.all([loadContacts(institutionId), loadDepartments(institutionId)]);
    } else {
      setContacts([]);
      setDepartments([]);
    }
  }

  async function handleSubmitContact() {
    if (!token || !selectedInstitutionId) return;
    setError(null);

    const body = {
      contactName: formData.contactName.trim() || undefined,
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      issueTags: formData.issueTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      priorityLevel: formData.priorityLevel,
      isPrimary: formData.isPrimary,
      departmentId: formData.departmentId || undefined,
    };

    try {
      if (editContactId) {
        await apiPatch(
          `/admin/directory/contacts/${editContactId}`,
          body,
          token,
        );
      } else {
        await apiPost(
          `/admin/directory/institutions/${selectedInstitutionId}/contacts`,
          body,
          token,
        );
      }
      await loadContacts(selectedInstitutionId);
      setShowForm(false);
      setEditContactId(null);
      setFormData({
        contactName: '',
        email: '',
        phone: '',
        issueTags: '',
        priorityLevel: 'MEDIUM',
        isPrimary: false,
        departmentId: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    }
  }

  async function handleEditContact(contact: ContactEntry) {
    setEditContactId(contact.id);
    setShowForm(true);
    setFormData({
      contactName: contact.contactName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      issueTags: contact.issueTags.join(', '),
      priorityLevel: contact.priorityLevel,
      isPrimary: contact.isPrimary,
      departmentId: contact.department?.id || '',
    });
  }

  async function handleDeleteContact(contactId: string) {
    if (!token || !selectedInstitutionId) return;
    if (!confirm('Delete this contact? This cannot be undone.')) return;

    try {
      await apiDelete(`/admin/directory/contacts/${contactId}`, token);
      await loadContacts(selectedInstitutionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm font-semibold text-zinc-900">Contact management for government submissions</p>
        <p className="mt-2 text-sm text-zinc-600">
          Pick an institution to manage its routing contacts, issue tags, and primary government recipients.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">Loading institutions…</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <label className="block text-sm font-semibold text-zinc-700">Select institution</label>
              <select
                value={selectedInstitutionId}
                onChange={(e) => void handleSelectInstitution(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Choose an institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            {selectedInstitutionId && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Contacts</p>
                    <p className="mt-1 text-sm text-zinc-600">Manage routing contacts for the selected institution.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(!showForm);
                      setEditContactId(null);
                      setFormData({
                        contactName: '',
                        email: '',
                        phone: '',
                        issueTags: '',
                        priorityLevel: 'MEDIUM',
                        isPrimary: false,
                        departmentId: '',
                      });
                    }}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    {showForm ? 'Cancel' : 'Add contact'}
                  </button>
                </div>

                {contacts.length === 0 ? (
                  <p className="mt-4 text-sm text-zinc-600">No contacts registered yet. Add a contact to make this institution available for petition routing.</p>
                ) : (
                  <div className="mt-4 space-y-3 text-sm">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-zinc-900">{contact.contactName || 'Unnamed contact'}</p>
                            <p className="mt-1 text-zinc-600">{contact.email || 'No email provided'}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {contact.isPrimary && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Primary</span>}
                            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">{contact.priorityLevel}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-600">
                          <span>{contact.phone || 'No phone'}</span>
                          <span>{contact.department?.name || 'General'}</span>
                          <span>{contact.issueTags.join(', ') || 'No tags'}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditContact(contact)}
                            className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteContact(contact.id)}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {showForm && selectedInstitutionId ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-zinc-900">{editContactId ? 'Edit contact' : 'New contact'}</h3>
                <div className="mt-4 grid gap-4">
                  <input
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Contact name"
                    className="w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email address"
                    className="w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                    className="w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="">General contact</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                  <input
                    value={formData.issueTags}
                    onChange={(e) => setFormData({ ...formData, issueTags: e.target.value })}
                    placeholder="Issue tags, comma separated"
                    className="w-full rounded-2xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <select
                      value={formData.priorityLevel}
                      onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })}
                      className="w-full rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-200">
                      <input
                        type="checkbox"
                        checked={formData.isPrimary}
                        onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Primary contact
                    </label>
                  </div>

                  {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSubmitContact}
                    className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    {editContactId ? 'Save contact' : 'Create contact'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
                Select an institution to manage routing contacts and government submission targets.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
