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

  return (
    <Layout>
      <div className="h-full overflow-auto px-6 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-medium font-serif text-nearblack" style={{ fontFamily: 'Georgia, serif' }}>项目列表</h1>
            {projects.length > 0 && (
              <p className="text-base text-olive mt-1">
                {projects.length} 个项目 · {projects.filter(p => p.status === 'active').length} 运行中
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-ivory text-sm font-medium rounded-xl transition-colors"
          >
            添加项目
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-olive text-sm">暂无项目</p>
            <p className="text-xs text-stone mt-1">点击上方按钮添加项目</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                state={projectStates[project.id]}
              />
            ))}
          </div>
        )}

        {/* Add Project Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-ivory rounded-2xl p-5 w-full max-w-md shadow-whisper">
              <h3 className="text-base font-medium font-serif text-nearblack mb-3">添加项目</h3>

              <div className="mb-3">
                <label className="block text-sm text-olive mb-1">
                  项目路径
                </label>
                <input
                  type="text"
                  value={newProjectPath}
                  onChange={(e) => setNewProjectPath(e.target.value)}
                  placeholder="/path/to/project"
                  className="w-full px-3 py-2 border border-borderCream rounded-xl bg-white focus:ring-2 focus:ring-focusBlue/30 focus:border-focusBlue text-sm transition-colors"
                />
              </div>

              {error && (
                <div className="mb-3 p-2.5 bg-warmRedLight text-warmRed rounded-lg text-sm">
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
                  className="flex-1 py-2 bg-warmSand rounded-lg text-charcoal hover:shadow-ring-warm transition-all text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleAddProject}
                  disabled={loading || !newProjectPath.trim()}
                  className="flex-1 py-2 bg-terracotta hover:bg-terracotta-hover text-ivory rounded-xl disabled:opacity-50 transition-colors text-sm"
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
