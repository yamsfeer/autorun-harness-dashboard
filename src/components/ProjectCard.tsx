import { Link } from 'react-router-dom';
import type { Project, ProjectState } from '../stores/useStore';

interface ProjectCardProps {
  project: Project;
  state?: ProjectState;
}

export default function ProjectCard({ project, state }: ProjectCardProps) {
  const stats = state?.statistics;
  const completed = stats?.completed || 0;
  const total = stats?.total || 0;
  const inProgress = stats?.in_progress || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isFullyCompleted = inProgress === 0 && completed === total && total > 0;

  const statusColor = project.status === 'active' ? 'bg-terracotta' : 'bg-stone';

  const card = (
    <div
      className={`bg-ivory rounded-xl border border-borderCream p-5 transition-all ${
        project.status === 'active'
          ? 'hover:shadow-ring-warm'
          : 'opacity-60'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1" style={{ maxWidth: 'calc(100% - 2rem)' }}>
          <h2 className="text-xl font-medium font-serif text-nearblack truncate" style={{ fontFamily: 'Georgia, serif' }}>
            <span className={`inline-block w-2 h-2 rounded-full shrink-0 mr-2 ${statusColor}`} />
            {project.name}
          </h2>
          <p className="text-sm text-olive mt-1 truncate" style={{ overflowWrap: 'break-word' }}>{project.path}</p>
        </div>
      </div>

      {/* Progress */}
      {stats && (
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-olive">进度</span>
            <span className="font-medium text-nearblack">{completed}/{total} 完成</span>
          </div>
          <div className="h-1.5 bg-borderCream rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                isFullyCompleted ? 'bg-warmGreen' : 'bg-terracotta'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 bg-borderCream rounded">
            <div className="font-medium text-nearblack">{stats.pending}</div>
            <div className="text-stone">待处理</div>
          </div>
          <div className="p-2 bg-terracotta-light rounded">
            <div className="font-medium text-terracotta">{stats.in_progress}</div>
            <div className="text-stone">进行中</div>
          </div>
          <div className="p-2 bg-warmGreenLight rounded">
            <div className="font-medium text-warmGreen">{stats.completed}</div>
            <div className="text-stone">已完成</div>
          </div>
          <div className="p-2 bg-warmRedLight rounded">
            <div className="font-medium text-warmRed">{stats.needs_human}</div>
            <div className="text-stone">需人工</div>
          </div>
        </div>
      )}

      {/* Added time */}
      <div className="mt-4 text-xs text-stone text-right">
        添加于 {new Date(project.addedAt).toLocaleDateString('zh-CN')}
      </div>
    </div>
  );

  return project.status === 'active' ? (
    <Link to={`/projects/${project.id}`} className="block">{card}</Link>
  ) : (
    card
  );
}
