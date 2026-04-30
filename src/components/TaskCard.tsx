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

  return (
    <div
      onClick={onClick}
      className="bg-white border border-borderCream rounded-lg p-3 cursor-pointer hover:shadow-ring-warm transition-shadow"
    >
      {/* Title */}
      <h2 className="font-medium font-serif text-nearblack text-sm mb-2" style={{ fontFamily: 'Georgia, serif' }}>
        {task.title}
      </h2>

      {/* Priority badge + AC dots */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]?.bg || 'bg-borderCream'} ${priorityColors[task.priority]?.text || 'text-stone'}`}>
          {priorityColors[task.priority]?.label || task.priority}
        </span>
        {acTotal > 0 && (
          <span className="text-xs text-stone">
            {Array.from({ length: acTotal }).map((_, idx) => {
              const ac = task.acceptance_criteria[idx];
              const color = ac?.status === 'pass' ? 'text-warmGreen' : ac?.status === 'fail' ? 'text-warmRed' : 'text-stone';
              return <span key={idx} className={color}>{ac?.status === 'pass' ? '●' : ac?.status === 'fail' ? '✗' : '○'}</span>;
            })}
            {' '}{acPassed}/{acTotal}
          </span>
        )}
      </div>

      {/* Attempts + timestamp */}
      <div className="flex items-center justify-between text-xs text-stone">
        {task.attempts > 0 ? (
          <span>尝试: {task.attempts}/3</span>
        ) : (
          <span>{task.id}</span>
        )}
      </div>
    </div>
  );
}
