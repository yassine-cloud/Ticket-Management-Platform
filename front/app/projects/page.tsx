"use client";
import React, { useState, useEffect } from 'react';
import { BaseLayout } from '@/components/layout/BaseLayout';
import Link from 'next/link';
import { Plus, FolderKanban, MoreVertical, LayoutGrid, X, Loader, DeleteIcon, Delete, Trash, Pencil } from 'lucide-react';
import { projectsAPI, type Project, type CreateProjectInput, type UpdateProjectInput } from '@/lib/api/projects.api';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    const response = await projectsAPI.getProjects();
    
    if (response.error) {
      setError(response.error);
      setProjects([]);
    } else {
      setProjects(response.data || []);
    }
    setIsLoading(false);
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.slug) {
      setError('Project name and key are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const input: CreateProjectInput = {
      name: formData.name,
      slug: formData.slug.toLowerCase(),
      description: formData.description || undefined,
      isPublic: true,
    };

    const response = await projectsAPI.createProject(input);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setProjects([...projects, response.data]);
      setFormData({ name: '', slug: '', description: '' });
      setIsModalOpen(false);
    }

    setIsSubmitting(false);
  };

  const handleEditProject = async () => {
    if (!editFormData.name || !editFormData.slug) {
      setError('Project name and key are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const input: UpdateProjectInput = {
      name: editFormData.name,
      slug: editFormData.slug.toLowerCase(),
      description: editFormData.description || undefined,
    };

    const response = await projectsAPI.updateProject(editFormData.id, input);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setProjects(projects.map(p => p.id === editFormData.id ? response?.data! : p));
      setIsEditModalOpen(false);
    }

    setIsSubmitting(false);
  };

  const handleOpenEditProject = (id: string) => {
    // get the project details and open the edit modal
    const project = projects.find(p => p.id === id);
    if (project) {
      setEditFormData({
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description || '',
      });
      setIsEditModalOpen(true);
    } else {
      setError('Project not found');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    const response = await projectsAPI.deleteProject(id);
    if (response.error) {
      setError(response.error);
    } else {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <BaseLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all active workspaces and their specific tickets.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow border border-transparent text-sm font-semibold transition-all hover:shadow-md"
        >
          <Plus className="w-4 h-4 font-bold" /> New Project
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-4 font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading projects...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FolderKanban className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">No projects yet. Create one to get started.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} className="block group">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-105 transition-transform duration-300">
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleOpenEditProject(project.id);
                    }}
                    className="text-gray-400 hover:text-blue-600 focus:outline-none transition-colors p-1 rounded hover:bg-blue-50"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteProject(project.id);
                    }}
                    className="text-gray-400 hover:text-red-600 focus:outline-none transition-colors p-1 rounded hover:bg-red-50"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                  </div>
                </div>
                
                <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{project.name}</h2>
                <p className="text-sm text-gray-500 mb-6 flex-grow">{project.description || 'No description provided'}</p>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 px-3 py-1 bg-gray-100 rounded-full">
                      {project.isPublic ? 'Public' : 'Private'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
               <button 
                 onClick={() => setIsModalOpen(false)} 
                 className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="e.g. Website Redesign"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Slug</label>
                <input 
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="e.g. website-redesign"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (no spaces, lowercase).</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="Briefly describe what this project is about..."
                  disabled={isSubmitting}
                ></textarea>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateProject}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Create Project'}
                </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
               <h2 className="text-xl font-bold text-gray-900">Edit Project</h2>
               <button 
                 onClick={() => setIsEditModalOpen(false)} 
                 className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
                <input 
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="e.g. Website Redesign"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Slug</label>
                <input 
                  type="text"
                  value={editFormData.slug}
                  onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="e.g. website-redesign"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">URL-friendly identifier (no spaces, lowercase).</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-900 bg-white"
                  placeholder="Briefly describe what this project is about..."
                  disabled={isSubmitting}
                ></textarea>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEditProject}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 border border-transparent rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
          </div>
        </div>
      )}
    </BaseLayout>
  );
}
