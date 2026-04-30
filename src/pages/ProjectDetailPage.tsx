import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/Layout';
import TaskBoard from '../components/TaskBoard';
import LogViewer from '../components/LogViewer';
import EvalReport from '../components/EvalReport';
import { api } from '../api/client';
import { useStore } from '../stores/useStore';
import { useSocket } from '../hooks/useSocket';
import type { EvaluatorReport } from '../stores/useStore';

type Tab = 'board' | 'reports' | 'logs' | 'spec';

const tabs: { id: Tab; label: string }[] = [
  { id: 'board', label: '任务看板' },
  { id: 'reports', label: '评估报告' },
  { id: 'logs', label: '执行日志' },
  { id: 'spec', label: '产品规格' },
];

interface TaskReportGroup {
  taskId: string;
  displayIndex: number;
  latestReport: EvaluatorReport;
  allReports: EvaluatorReport[];
  taskName?: string;
  priority?: string;
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projectStates, setProjectState, projects } = useStore();
  const { subscribeProject, unsubscribeProject } = useSocket();

  const [activeTab, setActiveTab] = useState<Tab>('board');
  const [selectedReportTaskId, setSelectedReportTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const project = projects.find(p => p.id === projectId);
  const state = projectStates[projectId || ''];

  useEffect(() => {
    if (!projectId) return;

    const loadState = async () => {
      setLoading(true);
      try {
        const data = await api.getProjectState(projectId);
        setProjectState(projectId, data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    if (!state) {
      loadState();
    } else {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      subscribeProject(projectId);
      return () => unsubscribeProject(projectId);
    }
  }, [projectId]);

  const taskReportGroups = useMemo<TaskReportGroup[]>(() => {
    if (!state) return [];

    const map = new Map<string, EvaluatorReport[]>();
    for (const report of state.reports) {
      if (!map.has(report.task_id)) map.set(report.task_id, []);
      map.get(report.task_id)!.push(report);
    }

    const groups: TaskReportGroup[] = [];
    for (const [taskId, reports] of map) {
      reports.sort((a, b) => b.attempt - a.attempt);
      const task = state.tasks.find(t => t.id === taskId);
      const numMatch = taskId.match(/(\d+)/);
      groups.push({
        taskId,
        displayIndex: numMatch ? parseInt(numMatch[1]) : groups.length + 1,
        latestReport: reports[0],
        allReports: reports,
        taskName: task?.title,
        priority: task?.priority,
      });
    }

    groups.sort((a, b) => a.displayIndex - b.displayIndex);
    return groups;
  }, [state]);

  useEffect(() => {
    if (taskReportGroups.length > 0 && !selectedReportTaskId) {
      setSelectedReportTaskId(taskReportGroups[0].taskId);
    }
  }, [taskReportGroups, selectedReportTaskId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-olive text-sm">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (error || !project || !state) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-warmRed mb-4 text-sm">{error || '项目不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-terracotta text-ivory rounded-xl text-sm"
          >
            返回项目列表
          </button>
        </div>
      </Layout>
    );
  }

  const stats = state.statistics;
  const isFullyCompleted = stats.in_progress === 0 && stats.completed === stats.total && stats.total > 0;

  const TimelineNode = ({ group, isSelected }: { group: TaskReportGroup; isSelected: boolean }) => {
    const passed = group.latestReport.final_decision === 'pass';
    const priorityColor =
      group.priority === 'high' ? 'ring-warmRed' :
      group.priority === 'medium' ? 'ring-warmAmber' :
      'ring-stone';

    return (
      <button
        onClick={() => setSelectedReportTaskId(group.taskId)}
        className="relative flex flex-col items-center shrink-0"
        style={{ minWidth: '52px' }}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
            isSelected
              ? passed
                ? 'bg-warmGreen border-warmGreen text-ivory scale-110 shadow-whisper'
                : 'bg-warmRed border-warmRed text-ivory scale-110 shadow-whisper'
              : passed
                ? 'bg-ivory border-warmGreen text-warmGreen hover:bg-warmGreenLight'
                : 'bg-ivory border-warmRed text-warmRed hover:bg-warmRedLight'
          } ${isSelected ? `ring-2 ring-offset-1 ring-offset-ivory ${priorityColor}` : ''}`}
        >
          {group.displayIndex}
        </div>
        <span className={`text-[10px] mt-1 font-medium ${passed ? 'text-warmGreen' : 'text-warmRed'}`}>
          {passed ? '通过' : '未通过'}
        </span>
        <span className="text-[10px] text-stone max-w-[70px] truncate mt-0.5" title={group.taskName || group.taskId}>
          {group.taskName || group.taskId}
        </span>
      </button>
    );
  };

  return (
    <Layout>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-borderCream bg-ivory">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-1 text-xs text-stone hover:text-olive transition-colors mb-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回列表
                </button>
                <h1 className="text-3xl font-medium font-serif text-nearblack" style={{ fontFamily: 'Georgia, serif' }}>
                  {state.project.name}
                </h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-sm text-stone truncate">{project.path}</p>
                  <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'active' ? 'bg-terracotta-light text-terracotta' : 'bg-borderCream text-stone'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'active' ? 'bg-terracotta' : 'bg-stone'}`} />
                    {project.status === 'active' ? '运行中' : '已丢失'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {/* Mini stats */}
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-nearblack">{stats.total}</div>
                    <div className="text-stone">总任务</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-terracotta">{stats.in_progress}</div>
                    <div className="text-stone">进行中</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-warmGreen">{stats.completed}</div>
                    <div className="text-stone">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-warmRed">{stats.needs_human}</div>
                    <div className="text-stone">需人工</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('确定要移除项目 "' + project.name + '" 吗？')) {
                      api.removeProject(projectId!).then(() => navigate('/'));
                    }
                  }}
                  className="px-3 py-1.5 bg-warmRedLight text-warmRed text-xs font-medium rounded-lg hover:bg-warmRedLight/80 transition-colors"
                >
                  删除项目
                </button>
              </div>
            </div>
            {/* Progress bar */}
            {stats.total > 0 && (
              <div className="mt-3 max-w-md">
                <div className="h-1.5 bg-borderCream rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${isFullyCompleted ? 'bg-warmGreen' : 'bg-terracotta'}`}
                    style={{ width: `${Math.round((stats.completed / stats.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="shrink-0 flex border-b border-borderCream bg-parchment px-6">
          <div className="max-w-7xl mx-auto w-full flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-nearblack'
                    : 'text-olive hover:text-nearblack'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-terracotta" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'board' && (
            <div className="h-full p-4">
              <TaskBoard tasks={state.tasks} />
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="h-full flex flex-col">
              {state.reports.length === 0 ? (
                <div className="flex items-center justify-center h-full text-olive text-sm">
                  暂无评估报告
                </div>
              ) : (
                <>
                  <div className="shrink-0 px-4 py-3 border-b border-borderCream bg-ivory">
                    <div className="text-xs font-medium text-stone uppercase tracking-wider mb-2">
                      任务评估时间线
                    </div>
                    <div className="flex items-center overflow-x-auto pb-1 scrollbar-thin">
                      <div className="flex items-center gap-0">
                        {taskReportGroups.map((group, idx) => (
                          <div key={group.taskId} className="flex items-center">
                            <TimelineNode
                              group={group}
                              isSelected={selectedReportTaskId === group.taskId}
                            />
                            {idx < taskReportGroups.length - 1 && (
                              <div className={`w-6 h-0.5 shrink-0 mx-1 ${
                                group.latestReport.final_decision === 'pass' ? 'bg-warmGreen/40' : 'bg-warmRed/40'
                              }`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedReportTaskId && (() => {
                      const group = taskReportGroups.find(g => g.taskId === selectedReportTaskId);
                      if (!group) return null;
                      return (
                        <>
                          <div className="bg-ivory rounded-lg border border-borderCream px-4 py-3 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium font-serif text-nearblack">任务 #{group.displayIndex}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  group.latestReport.final_decision === 'pass'
                                    ? 'bg-warmGreenLight text-warmGreen'
                                    : 'bg-warmRedLight text-warmRed'
                                }`}>
                                  {group.latestReport.final_decision === 'pass' ? '通过' : '未通过'}
                                </span>
                                {group.priority && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    group.priority === 'high' ? 'bg-warmRedLight text-warmRed' :
                                    group.priority === 'medium' ? 'bg-warmAmberLight text-warmAmber' :
                                    'bg-borderCream text-stone'
                                  }`}>
                                    {group.priority === 'high' ? '高优' : group.priority === 'medium' ? '中优' : '低优'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone mt-1">
                                {group.taskName || group.taskId} · 尝试 #{group.latestReport.attempt} · {new Date(group.latestReport.timestamp).toLocaleString('zh-CN')}
                              </div>
                            </div>
                            {group.allReports.length > 1 && (
                              <div className="text-xs text-stone">
                                共 {group.allReports.length} 次评估
                              </div>
                            )}
                          </div>

                          {group.allReports.map(report => (
                            <EvalReport
                              key={report.report_id}
                              report={report}
                              projectId={projectId!}
                            />
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="h-full p-4">
              <LogViewer content={state.progress} />
            </div>
          )}

          {activeTab === 'spec' && (
            <div className="h-full overflow-y-auto p-4">
              <div className="bg-ivory rounded-lg border border-borderCream">
                {state.spec ? (
                  <div className="prose prose-sm max-w-none p-5">
                    <ReactMarkdown>{state.spec}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center text-olive text-sm py-12">
                    暂无产品规格文档
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
