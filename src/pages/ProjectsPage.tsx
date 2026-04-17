import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import { api } from '../api/client';
import { useStore } from '../stores/useStore';

export default function ProjectsPage() {
  const { projects, setProjects, projectStates, setProjectState } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjectPath, setNewProjectPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const list = await api.getProjects();
        setProjects(list);

        // 加载每个项目的状态
        for (const project of list) {
          if (project.status === 'active') {
            const state = await api.getProjectState(project.id);
            setProjectState(project.id, state);
          }
        }
      } catch (err) {
        console.error('加载项目失败:', err);
      }
    };

    loadProjects();
  }, []);

  const handleAddProject = async () => {
    if (!newProjectPath.trim()) return;

    setLoading(true);
    setError('');

    try {
      const project = await api.addProject(newProjectPath.trim());
      setProjects([...projects, project]);
      
      // 加载初始状态
      const state = await api.getProjectState(project.id);
      setProjectState(project.id, state);

      setShowAddModal(false);
      setNewProjectPath('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProject = async (projectId: string, projectName: string) => {
    if (!confirm(`确定要移除项目 "${projectName}" 吗？`)) {
      return;
    }

    try {
      await api.removeProject(projectId);
      const { removeProject } = useStore.getState();
      removeProject(projectId);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">项目列表</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            添加项目
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无项目</p>
            <p className="text-sm text-gray-400 mt-2">点击上方按钮添加项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="relative">
                <ProjectCard
                  project={project}
                  state={projectStates[project.id]}
                />
                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveProject(project.id, project.name);
                  }}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="移除项目"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Project Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">添加项目</h3>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  项目路径
                </label>
                <input
                  type="text"
                  value={newProjectPath}
                  onChange={(e) => setNewProjectPath(e.target.value)}
                  placeholder="/path/to/project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewProjectPath('');
                    setError('');
                  }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddProject}
                  disabled={loading || !newProjectPath.trim()}
                  className="flex-1 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 transition-colors"
                >
                  {loading ? '添加中...' : '添加'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
