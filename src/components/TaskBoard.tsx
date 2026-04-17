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
}

const columns: Column[] = [
  { id: 'pending', title: '待处理', status: ['pending'], color: 'bg-gray-100' },
  { id: 'in_progress', title: '进行中', status: ['in_progress'], color: 'bg-blue-100' },
  { id: 'completed', title: '已完成', status: ['completed'], color: 'bg-green-100' },
  { id: 'needs_human', title: '需人工介入', status: ['blocked', 'needs_human'], color: 'bg-red-100' },
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
    <div className="h-full">
      {/* Board */}
      <div className="grid grid-cols-4 gap-4 h-full">
        {columns.map((column) => {
          const columnTasks = getTasksByColumn(column);
          return (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div className={`px-3 py-2 rounded-t-lg ${column.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{column.title}</span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-gray-50 rounded-b-lg p-2 overflow-y-auto space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => handleTaskClick(task)}
                  />
                ))}
                {columnTasks.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-4">
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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedTask.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedTask.id} · {selectedTask.category} · {selectedTask.priority} 优先级
                </p>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">描述</h4>
              <p className="text-gray-600 text-sm">{selectedTask.description}</p>
            </div>

            {/* Acceptance Criteria */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">验收标准</h4>
              <div className="space-y-3">
                {selectedTask.acceptance_criteria.map((ac) => (
                  <div key={ac.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          ac.status === 'pass' ? 'bg-green-500' :
                          ac.status === 'fail' ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      />
                      <span className="font-medium text-sm">{ac.description}</span>
                    </div>
                    <ol className="text-sm text-gray-600 space-y-1 ml-4">
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
                <h4 className="font-medium text-gray-900 mb-2">备注</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedTask.notes.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
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
