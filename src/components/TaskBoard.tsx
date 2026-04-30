import { useState } from 'react';
import type { Task } from '../stores/useStore';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

interface Column {
  id: string;
  title: string;
  status: Task['status'][];
  color: string;
  textColor: string;
}

const columns: Column[] = [
  { id: 'pending', title: '待处理', status: ['pending'], color: 'bg-borderCream', textColor: 'text-stone' },
  { id: 'in_progress', title: '进行中', status: ['in_progress'], color: 'bg-terracotta-light', textColor: 'text-terracotta' },
  { id: 'completed', title: '已完成', status: ['completed'], color: 'bg-warmGreenLight', textColor: 'text-warmGreen' },
  { id: 'needs_human', title: '需人工', status: ['blocked', 'needs_human'], color: 'bg-warmRedLight', textColor: 'text-warmRed' },
];

export default function TaskBoard({ tasks, onTaskClick }: TaskBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const getTasksByColumn = (column: Column): Task[] => {
    return tasks.filter(task => column.status.includes(task.status));
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    onTaskClick?.(task);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Board */}
      <div className="grid grid-cols-4 gap-4 flex-1 min-h-0">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column);
          return (
            <div key={column.id} className="flex flex-col min-h-0">
              {/* Column Header */}
              <div className={`px-2.5 py-1.5 rounded-md ${column.color} mb-2 shrink-0`}>
                <div className="font-medium font-serif text-lg" style={{ fontFamily: 'Georgia, serif', color: column.id === 'pending' ? '#87867f' : column.id === 'in_progress' ? '#c96442' : column.id === 'completed' ? '#4a7c42' : '#b53333' }}>
                  {column.title}
                </div>
                <div className="text-sm text-olive">
                  {columnTasks.length}
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1 pb-2">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center text-stone text-xs py-6">
                    暂无任务
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-ivory rounded-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-whisper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium font-serif text-nearblack">{selectedTask.title}</h3>
                <p className="text-xs text-olive mt-1">
                  {selectedTask.id} · {selectedTask.category} · {selectedTask.priority} 优先级
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-stone hover:text-olive transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <div className="mb-5">
              <h4 className="font-medium text-nearblack mb-2 text-sm">描述</h4>
              <p className="text-olive text-sm leading-relaxed">{selectedTask.description}</p>
            </div>

            {/* Acceptance Criteria */}
            <div className="mb-5">
              <h4 className="font-medium text-nearblack mb-2 text-sm">验收标准</h4>
              <div className="space-y-2">
                {selectedTask.acceptance_criteria.map((ac) => (
                  <div key={ac.id} className="border border-borderCream rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ac.status === 'pass' ? 'bg-warmGreen' :
                          ac.status === 'fail' ? 'bg-warmRed' : 'bg-stone'
                        }`}
                      />
                      <span className="font-medium text-sm">{ac.description}</span>
                    </div>
                    <ol className="text-sm text-olive space-y-1 ml-4">
                      {ac.steps.map((step, idx) => (
                        <li key={idx} className="list-decimal">{step}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {selectedTask.notes.length > 0 && (
              <div>
                <h4 className="font-medium text-nearblack mb-2 text-sm">备注</h4>
                <ul className="text-sm text-olive space-y-1">
                  {selectedTask.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-stone">•</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
