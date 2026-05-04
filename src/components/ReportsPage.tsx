import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Task, EvaluatorReport } from '../stores/useStore';
import ScreenshotViewer from './ScreenshotViewer';

interface TaskReportGroup {
  taskId: string;
  displayIndex: number;
  task?: Task;
  latestReport: EvaluatorReport;
  allReports: EvaluatorReport[];
}

interface ReportsPageProps {
  tasks: Task[];
  reports: EvaluatorReport[];
  projectId: string;
}

function groupReportsByTask(reports: EvaluatorReport[], tasks: Task[]): TaskReportGroup[] {
  const map = new Map<string, EvaluatorReport[]>();
  for (const report of reports) {
    if (!map.has(report.task_id)) map.set(report.task_id, []);
    map.get(report.task_id)!.push(report);
  }

  const groups: TaskReportGroup[] = [];
  for (const [taskId, taskReports] of map) {
    taskReports.sort((a, b) => b.attempt - a.attempt);
    const task = tasks.find(t => t.id === taskId);
    const numMatch = taskId.match(/(\d+)/);
    groups.push({
      taskId,
      displayIndex: numMatch ? parseInt(numMatch[1]) : groups.length + 1,
      task,
      latestReport: taskReports[0],
      allReports: taskReports,
    });
  }

  groups.sort((a, b) => a.displayIndex - b.displayIndex);
  return groups;
}

export default function ReportsPage({ tasks, reports, projectId }: ReportsPageProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedAttempts, setExpandedAttempts] = useState<Set<string>>(new Set());

  const taskGroups = groupReportsByTask(reports, tasks);

  // 默认选中第一个任务
  const effectiveSelectedId = selectedTaskId || (taskGroups.length > 0 ? taskGroups[0].taskId : null);
  const selectedGroup = taskGroups.find(g => g.taskId === effectiveSelectedId);

  const toggleAttempt = (reportId: string) => {
    setExpandedAttempts(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  if (reports.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-olive text-sm">
        暂无评估报告
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* 左侧任务列表 */}
      <div className="w-64 shrink-0 border-r border-borderCream bg-parchment/50 overflow-y-auto">
        <div className="p-3 border-b border-borderCream sticky top-0 bg-parchment/90 backdrop-blur-sm">
          <div className="text-xs font-medium text-stone uppercase tracking-wider">
            任务列表 ({taskGroups.length})
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warmGreen" />
              <span className="text-xs text-stone">{taskGroups.filter(g => g.latestReport.final_decision === 'pass').length} 通过</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warmRed" />
              <span className="text-xs text-stone">{taskGroups.filter(g => g.latestReport.final_decision !== 'pass').length} 未通过</span>
            </div>
          </div>
        </div>

        <div className="p-2 space-y-1">
          {taskGroups.map((group) => {
            const passed = group.latestReport.final_decision === 'pass';
            const isSelected = effectiveSelectedId === group.taskId;

            return (
              <button
                key={group.taskId}
                onClick={() => setSelectedTaskId(group.taskId)}
                className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                  isSelected
                    ? 'bg-ivory shadow-whisper border-terracotta'
                    : 'hover:bg-ivory/50 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    passed
                      ? 'bg-warmGreen text-ivory'
                      : 'bg-warmRed text-ivory'
                  }`}>
                    {group.displayIndex}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-nearblack truncate">
                      {group.task?.title || group.taskId}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${passed ? 'text-warmGreen' : 'text-warmRed'}`}>
                        {passed ? '通过' : '未通过'}
                      </span>
                      {group.allReports.length > 1 && (
                        <span className="text-xs text-stone">
                          {group.allReports.length} 次尝试
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 右侧详情区域 */}
      <div className="flex-1 overflow-y-auto">
        {selectedGroup ? (
          <div className="p-4 space-y-4">
            {/* 任务标题区 */}
            <div className="bg-ivory rounded-xl border border-borderCream p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-medium font-serif text-nearblack">
                    任务 #{selectedGroup.displayIndex} - {selectedGroup.task?.title || selectedGroup.taskId}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      selectedGroup.latestReport.final_decision === 'pass'
                        ? 'bg-warmGreenLight text-warmGreen'
                        : 'bg-warmRedLight text-warmRed'
                    }`}>
                      {selectedGroup.latestReport.final_decision === 'pass' ? '通过' : '未通过'}
                    </span>
                    {selectedGroup.task?.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedGroup.task.priority === 'high' ? 'bg-warmRedLight text-warmRed' :
                        selectedGroup.task.priority === 'medium' ? 'bg-warmAmberLight text-warmAmber' :
                        'bg-borderCream text-stone'
                      }`}>
                        {selectedGroup.task.priority === 'high' ? '高优' : 
                         selectedGroup.task.priority === 'medium' ? '中优' : '低优'}
                      </span>
                    )}
                    <span className="text-xs text-stone">
                      尝试 #{selectedGroup.latestReport.attempt} 次
                    </span>
                  </div>
                </div>
                {selectedGroup.allReports.length > 1 && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-nearblack">
                      共 {selectedGroup.allReports.length} 次评估
                    </div>
                    <div className="text-xs text-stone">
                      最新: {new Date(selectedGroup.latestReport.timestamp).toLocaleString('zh-CN')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 任务描述 */}
            {selectedGroup.task?.description && (
              <div className="bg-ivory rounded-xl border border-borderCream p-4">
                <h3 className="font-medium text-nearblack mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  任务描述
                </h3>
                <div className="prose prose-sm max-w-none text-olive">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedGroup.task.description}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* 验收标准 */}
            {selectedGroup.task?.acceptance_criteria && selectedGroup.task.acceptance_criteria.length > 0 && (
              <div className="bg-ivory rounded-xl border border-borderCream p-4">
                <h3 className="font-medium text-nearblack mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  验收标准
                </h3>
                <div className="space-y-2">
                  {selectedGroup.task.acceptance_criteria.map((ac, idx) => (
                    <div key={ac.id} className="border border-borderCream rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          ac.status === 'pass' ? 'bg-warmGreen text-ivory' :
                          ac.status === 'fail' ? 'bg-warmRed text-ivory' :
                          'bg-borderCream text-stone'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-nearblack">{ac.description}</span>
                            <span className={`text-xs ${
                              ac.status === 'pass' ? 'text-warmGreen' :
                              ac.status === 'fail' ? 'text-warmRed' : 'text-stone'
                            }`}>
                              {ac.status === 'pass' ? '通过' : ac.status === 'fail' ? '失败' : '待验证'}
                            </span>
                          </div>
                          {ac.steps.length > 0 && (
                            <ol className="text-xs text-olive mt-2 space-y-1 ml-4">
                              {ac.steps.map((step, stepIdx) => (
                                <li key={stepIdx} className="list-decimal">{step}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 评估历史 */}
            <div className="bg-ivory rounded-xl border border-borderCream p-4">
              <h3 className="font-medium text-nearblack mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                评估历史 ({selectedGroup.allReports.length} 次尝试)
              </h3>

              <div className="space-y-3">
                {selectedGroup.allReports.map((report) => {
                  const isExpanded = expandedAttempts.has(report.report_id);
                  const passed = report.final_decision === 'pass';

                  return (
                    <div key={report.report_id} className="border border-borderCream rounded-lg overflow-hidden">
                      {/* 报告头部 - 可点击展开 */}
                      <button
                        onClick={() => toggleAttempt(report.report_id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-borderCream/30 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            passed ? 'bg-warmGreenLight text-warmGreen' : 'bg-warmRedLight text-warmRed'
                          }`}>
                            尝试 #{report.attempt}
                          </span>
                          <span className={`text-sm font-medium ${passed ? 'text-warmGreen' : 'text-warmRed'}`}>
                            {passed ? '通过' : '未通过'}
                          </span>
                          <span className="text-xs text-stone">
                            {(report.total_weighted_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-stone">
                            {new Date(report.timestamp).toLocaleString('zh-CN')}
                          </span>
                          <svg
                            className={`w-4 h-4 text-stone transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* 展开内容 */}
                      {isExpanded && (
                        <div className="border-t border-borderCream p-4 space-y-4 bg-parchment/30">
                          {/* 摘要 */}
                          <div>
                            <h5 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">摘要</h5>
                            <div className="prose prose-sm max-w-none text-olive">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.summary}</ReactMarkdown>
                            </div>
                          </div>

                          {/* 质量评分 */}
                          <div>
                            <h5 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">质量评分</h5>
                            <div className="grid grid-cols-4 gap-2">
                              {Object.entries(report.quality_scores).map(([key, score]) => (
                                <div key={key} className="text-center p-2 bg-ivory rounded-lg border border-borderCream">
                                  <div className={`text-lg font-semibold ${
                                    score.score >= 0.8 ? 'text-warmGreen' :
                                    score.score >= 0.6 ? 'text-warmAmber' : 'text-warmRed'
                                  }`}>
                                    {(score.score * 100).toFixed(0)}%
                                  </div>
                                  <div className="text-xs text-olive mt-0.5">
                                    {key === 'functionality' ? '功能性' :
                                     key === 'code_quality' ? '代码质量' :
                                     key === 'product_depth' ? '产品深度' : '视觉设计'}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center justify-center gap-2 text-sm">
                              <span className="text-olive">加权总分:</span>
                              <span className={`font-semibold ${
                                report.total_weighted_score >= report.threshold ? 'text-warmGreen' : 'text-warmRed'
                              }`}>
                                {(report.total_weighted_score * 100).toFixed(1)}%
                              </span>
                              <span className="text-stone">(阈值: {(report.threshold * 100).toFixed(0)}%)</span>
                            </div>
                          </div>

                          {/* 验收标准结果 */}
                          <div>
                            <h5 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">验收标准结果</h5>
                            <div className="space-y-2">
                              {report.criteria_results.map((cr) => (
                                <div key={cr.criterion_id} className="border border-borderCream rounded-lg p-3 bg-ivory">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className={`w-2 h-2 rounded-full ${
                                      cr.result === 'pass' ? 'bg-warmGreen' : 'bg-warmRed'
                                    }`} />
                                    <span className="font-medium text-sm text-nearblack">{cr.description}</span>
                                    <span className={`text-xs ${
                                      cr.result === 'pass' ? 'text-warmGreen' : 'text-warmRed'
                                    }`}>
                                      {cr.result === 'pass' ? '通过' : '失败'}
                                    </span>
                                  </div>
                                  {cr.details.length > 0 && (
                                    <div className="text-xs text-olive space-y-1 ml-4">
                                      {cr.details.map((d) => (
                                        <div key={d.step} className="flex items-start gap-2">
                                          <span className={`w-4 h-4 flex items-center justify-center rounded text-[10px] font-bold ${
                                            d.status === 'pass' ? 'bg-warmGreenLight text-warmGreen' :
                                            d.status === 'fail' ? 'bg-warmRedLight text-warmRed' :
                                            'bg-borderCream text-stone'
                                          }`}>
                                            {d.step}
                                          </span>
                                          <span className="flex-1">
                                            <span className="prose prose-sm inline">
                                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.action}</ReactMarkdown>
                                            </span>
                                            {d.reason && (
                                              <span className="text-warmRed ml-2">({d.reason})</span>
                                            )}
                                            {d.note && (
                                              <span className="text-stone ml-2">[{d.note}]</span>
                                            )}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 截图 */}
                          {report.screenshot_paths.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">截图</h5>
                              <ScreenshotViewer
                                projectId={projectId}
                                screenshots={report.screenshot_paths}
                              />
                            </div>
                          )}

                          {/* 评估器反馈 */}
                          {report.feedback_for_generator && (
                            <div>
                              <h5 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">评估器反馈</h5>
                              <div className="p-3 bg-warmAmberLight rounded-lg border border-warmAmber/20">
                                <div className="prose prose-sm max-w-none text-olive">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.feedback_for_generator}</ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-olive text-sm">
            选择一个任务查看详情
          </div>
        )}
      </div>
    </div>
  );
}
