import type { Task } from '../stores/useStore';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
    high: { bg: 'bg-warmRedLight', text: 'text-warmRed', label: '高' },
    medium: { bg: 'bg-warmAmberLight', text: 'text-warmAmber', label: '中' },
    low: { bg: 'bg-borderCream', text: 'text-stone', label: '低' },
  };

  const acTotal = task.acceptance_criteria.length;
  const acPassed = task.acceptance_criteria.filter(ac => ac.status === 'pass').length;
  const acFailed = task.acceptance_criteria.filter(ac => ac.status === 'fail').length;
  const depCount = task.dependencies.length;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-borderCream rounded-lg p-3 cursor-pointer hover:shadow-ring-warm transition-shadow"
    >
      {/* Title */}
      <h2 className="font-medium font-serif text-nearblack text-sm mb-2" style={{ fontFamily: 'Georgia, serif' }}>
        {task.title}
      </h2>

      {/* Priority + Category */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]?.bg || 'bg-borderCream'} ${priorityColors[task.priority]?.text || 'text-stone'}`}>
          {priorityColors[task.priority]?.label || task.priority}
        </span>
        {task.category && (
          <span className="text-xs text-olive bg-borderCream/50 px-1.5 py-0.5 rounded">
            {task.category}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-stone">
        {/* 尝试次数 */}
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{task.attempts}/3</span>
        </div>

        {/* 验收标准 */}
        {acTotal > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{acPassed}/{acTotal}</span>
            {acPassed === acTotal && acTotal > 0 && (
              <span className="text-warmGreen">✓</span>
            )}
          </div>
        )}

        {/* 未通过数量 */}
        {acFailed > 0 && (
          <div className="flex items-center gap-0.5 text-warmRed">
            <span>✗{acFailed}</span>
          </div>
        )}

        {/* 依赖数量 */}
        {depCount > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>{depCount}</span>
          </div>
        )}
      </div>

      {/* Assigned to */}
      {task.assigned_to && (
        <div className="mt-2 pt-2 border-t border-borderCream/50 text-xs text-olive flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>{task.assigned_to}</span>
        </div>
      )}
    </div>
  );
}
