import type { Task } from '../stores/useStore';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const statusColors: Record<string, string> = {
    pending: 'bg-gray-50 border-gray-200',
    in_progress: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    blocked: 'bg-yellow-50 border-yellow-200',
    needs_human: 'bg-red-50 border-red-200',
  };

  const priorityColors: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-gray-500',
  };

  // 计算验收标准通过率
  const acTotal = task.acceptance_criteria.length;
  const acPassed = task.acceptance_criteria.filter(ac => ac.status === 'pass').length;
  const acPercentage = acTotal > 0 ? Math.round((acPassed / acTotal) * 100) : 0;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${statusColors[task.status]}`}
    >
      {/* Title */}
      <h4 className="font-medium text-gray-900 text-sm mb-2">{task.title}</h4>

      {/* ID and Priority */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500">{task.id}</span>
        <span className={`text-xs ${priorityColors[task.priority]}`}>
          {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
        </span>
      </div>

      {/* Acceptance Criteria Progress */}
      {acTotal > 0 && (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">验收标准</span>
            <span className="text-gray-600">{acPassed}/{acTotal}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${acPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Attempts */}
      {task.attempts > 0 && (
        <div className="text-xs text-gray-500">
          尝试次数: {task.attempts}/3
        </div>
      )}
    </div>
  );
}
