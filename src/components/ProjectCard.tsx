import { useNavigate } from 'react-router-dom';
import type { Project, ProjectState } from '../stores/useStore';

interface ProjectCardProps {
  project: Project;
  state?: ProjectState;
}

export default function ProjectCard({ project, state }: ProjectCardProps) {
  const navigate = useNavigate();

  const stats = state?.statistics;
  const completed = stats?.completed || 0;
  const total = stats?.total || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statusColor = project.status === 'active' ? 'bg-green-500' : 'bg-red-500';
  const statusText = project.status === 'active' ? '运行中' : '已丢失';

  return (
    <div
      onClick={() => project.status === 'active' && navigate(`/projects/${project.id}`)}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 transition-all ${
        project.status === 'active'
          ? 'hover:shadow-md hover:border-primary-300 cursor-pointer'
          : 'opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <p className="text-sm text-gray-500 mt-1 truncate">{project.path}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-xs text-gray-500">{statusText}</span>
        </div>
      </div>

      {/* Progress */}
      {stats && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">进度</span>
            <span className="font-medium">{completed}/{total} 完成</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 bg-gray-50 rounded">
            <div className="font-medium text-gray-900">{stats.pending}</div>
            <div className="text-gray-500">待处理</div>
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <div className="font-medium text-blue-700">{stats.in_progress}</div>
            <div className="text-gray-500">进行中</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="font-medium text-green-700">{stats.completed}</div>
            <div className="text-gray-500">已完成</div>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <div className="font-medium text-red-700">{stats.needs_human}</div>
            <div className="text-gray-500">需人工</div>
          </div>
        </div>
      )}

      {/* Added time */}
      <div className="mt-4 text-xs text-gray-400">
        添加于 {new Date(project.addedAt).toLocaleDateString('zh-CN')}
      </div>
    </div>
  );
}
