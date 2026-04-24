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

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'board', label: '任务看板', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { id: 'reports', label: '评估报告', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 'logs', label: '执行日志', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { id: 'spec', label: '产品规格', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
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

  // 加载项目状态
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

  // 订阅项目更新
  useEffect(() => {
    if (projectId) {
      subscribeProject(projectId);
      return () => unsubscribeProject(projectId);
    }
  }, [projectId]);

  // 评估报告按任务分组
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
      // 提取数字编号，如 task-3 → 3
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

  // 默认选中第一个任务的报告
  useEffect(() => {
    if (taskReportGroups.length > 0 && !selectedReportTaskId) {
      setSelectedReportTaskId(taskReportGroups[0].taskId);
    }
  }, [taskReportGroups, selectedReportTaskId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500 text-sm">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (error || !project || !state) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-500 mb-4 text-sm">{error || '项目不存在'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm"
          >
            返回项目列表
          </button>
        </div>
      </Layout>
    );
  }

  const stats = state.statistics;

  // 左侧导航栏
  const sidebar = (
    <div className="flex flex-col h-full">
      {/* 返回 + 项目名 */}
      <div className="px-3 py-2.5 border-b border-gray-100">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回列表
        </button>
        <div className="text-sm font-semibold text-gray-900 truncate" title={state.project.name}>
          {state.project.name}
        </div>
        <div className="text-xs text-gray-400 truncate mt-0.5" title={project.path}>
          {project.path}
        </div>
      </div>

      {/* Tab 导航 */}
      <nav className="flex-1 py-2 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors text-left ${
              activeTab === tab.id
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 迷你统计 */}
      <div className="border-t border-gray-100 px-3 py-2.5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">
          统计
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">总任务</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">已完成</span>
            <span className="font-medium text-green-600">{stats.completed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">进行中</span>
            <span className="font-medium text-blue-600">{stats.in_progress}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">需人工</span>
            <span className="font-medium text-red-600">{stats.needs_human}</span>
          </div>
        </div>
        {/* 进度条 */}
        <div className="mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-500"
              style={{
                width: `${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%`
              }}
            />
          </div>
          <div className="text-right text-xs text-gray-400 mt-0.5">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </div>
        </div>
      </div>
    </div>
  );

  // 时间线任务节点
  const TimelineNode = ({ group, isSelected }: { group: TaskReportGroup; isSelected: boolean }) => {
    const passed = group.latestReport.final_decision === 'pass';
    const priorityColor =
      group.priority === 'high' ? 'ring-red-400' :
      group.priority === 'medium' ? 'ring-yellow-400' :
      'ring-gray-300';

    return (
      <button
        onClick={() => setSelectedReportTaskId(group.taskId)}
        className="relative flex flex-col items-center shrink-0"
        style={{ minWidth: '52px' }}
      >
        {/* 圆点 */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
            isSelected
              ? passed
                ? 'bg-green-500 border-green-500 text-white scale-110 shadow-md'
                : 'bg-red-500 border-red-500 text-white scale-110 shadow-md'
              : passed
                ? 'bg-white border-green-400 text-green-600 hover:bg-green-50'
                : 'bg-white border-red-400 text-red-500 hover:bg-red-50'
          } ${isSelected ? `ring-2 ring-offset-1 ${priorityColor}` : ''}`}
        >
          {group.displayIndex}
        </div>

        {/* 通过/未通过徽章 */}
        <span className={`text-[10px] mt-1 font-medium ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? '通过' : '未通过'}
        </span>

        {/* 任务名 */}
        <span className="text-[10px] text-gray-400 max-w-[70px] truncate mt-0.5" title={group.taskName || group.taskId}>
          {group.taskName || group.taskId}
        </span>
      </button>
    );
  };

  return (
    <Layout sidebar={sidebar}>
      <div className="h-full overflow-hidden">
        {activeTab === 'board' && (
          <div className="h-full p-3">
            <TaskBoard tasks={state.tasks} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="h-full flex flex-col">
            {state.reports.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                暂无评估报告
              </div>
            ) : (
              <>
                {/* 时间线导航 */}
                <div className="shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
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
                              group.latestReport.final_decision === 'pass' ? 'bg-green-300' : 'bg-red-300'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 报告内容 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {selectedReportTaskId && (() => {
                    const group = taskReportGroups.find(g => g.taskId === selectedReportTaskId);
                    if (!group) return null;
                    return (
                      <>
                        {/* 任务信息头部 */}
                        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">任务 #{group.displayIndex}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                group.latestReport.final_decision === 'pass'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {group.latestReport.final_decision === 'pass' ? '通过' : '未通过'}
                              </span>
                              {group.priority && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  group.priority === 'high' ? 'bg-red-50 text-red-600' :
                                  group.priority === 'medium' ? 'bg-yellow-50 text-yellow-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {group.priority === 'high' ? '高优' : group.priority === 'medium' ? '中优' : '低优'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {group.taskName || group.taskId} · 尝试 #{group.latestReport.attempt} · {new Date(group.latestReport.timestamp).toLocaleString('zh-CN')}
                            </div>
                          </div>
                          {group.allReports.length > 1 && (
                            <div className="text-xs text-gray-400">
                              共 {group.allReports.length} 次评估
                            </div>
                          )}
                        </div>

                        {/* 该任务的所有报告 */}
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
          <div className="h-full p-3">
            <LogViewer content={state.progress} />
          </div>
        )}

        {activeTab === 'spec' && (
          <div className="h-full overflow-y-auto p-3">
            <div className="bg-white rounded-lg border border-gray-200">
              {state.spec ? (
                <div className="prose prose-sm max-w-none p-5">
                  <ReactMarkdown>{state.spec}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-center text-gray-500 text-sm py-12">
                  暂无产品规格文档
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
