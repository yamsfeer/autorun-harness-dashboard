import type { EvaluatorReport } from '../stores/useStore';
import ScreenshotViewer from './ScreenshotViewer';

interface EvalReportProps {
  report: EvaluatorReport;
  projectId: string;
}

export default function EvalReport({ report, projectId }: EvalReportProps) {
  const resultColor = report.final_decision === 'pass' ? 'text-warmGreen' : 'text-warmRed';
  const resultBg = report.final_decision === 'pass' ? 'bg-warmGreenLight' : 'bg-warmRedLight';

  return (
    <div className="bg-ivory rounded-xl border border-borderCream p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-medium font-serif text-nearblack">
            任务 {report.task_id} - 尝试 #{report.attempt}
          </h4>
          <p className="text-sm text-stone mt-1">
            {new Date(report.timestamp).toLocaleString('zh-CN')}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${resultBg} ${resultColor}`}>
          {report.final_decision === 'pass' ? '通过' : '未通过'}
        </div>
      </div>

      {/* Summary */}
      <div className="mb-4 p-3 bg-borderCream/40 rounded-lg">
        <p className="text-sm text-olive leading-relaxed">{report.summary}</p>
      </div>

      {/* Criteria Results */}
      <div className="mb-4">
        <h5 className="font-medium text-nearblack mb-2">验收标准结果</h5>
        <div className="space-y-2">
          {report.criteria_results.map((cr) => (
            <div key={cr.criterion_id} className="border border-borderCream rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    cr.result === 'pass' ? 'bg-warmGreen' : 'bg-warmRed'
                  }`}
                />
                <span className="font-medium text-sm">{cr.description}</span>
                <span className={`text-xs ${
                  cr.result === 'pass' ? 'text-warmGreen' : 'text-warmRed'
                }`}>
                  {cr.result === 'pass' ? '通过' : '失败'}
                </span>
              </div>
              <div className="text-xs text-stone space-y-1">
                {cr.details.map((d) => (
                  <div key={d.step} className="flex items-start gap-2">
                    <span
                      className={`w-4 h-4 flex items-center justify-center rounded text-xs ${
                        d.status === 'pass' ? 'bg-warmGreenLight text-warmGreen' :
                        d.status === 'fail' ? 'bg-warmRedLight text-warmRed' :
                        'bg-borderCream text-stone'
                      }`}
                    >
                      {d.step}
                    </span>
                    <span className="flex-1">
                      {d.action}
                      {d.reason && (
                        <span className="text-warmRed ml-2">({d.reason})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Scores */}
      <div className="mb-4">
        <h5 className="font-medium text-nearblack mb-2">质量评分</h5>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(report.quality_scores).map(([key, score]) => (
            <div key={key} className="text-center p-2 bg-borderCream/40 rounded">
              <div className="text-lg font-semibold text-nearblack">
                {(score.score * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-olive">
                {key === 'functionality' ? '功能性' :
                 key === 'code_quality' ? '代码质量' :
                 key === 'product_depth' ? '产品深度' : '视觉设计'}
              </div>
              <div className="text-xs text-stone">权重 {score.weight * 100}%</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-center">
          <span className="text-sm text-olive">加权总分: </span>
          <span className="font-semibold text-nearblack">
            {(report.total_weighted_score * 100).toFixed(1)}%
          </span>
          <span className="text-sm text-stone ml-2">
            (阈值: {(report.threshold * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      {/* Screenshots */}
      {report.screenshot_paths.length > 0 && (
        <div className="mb-4">
          <h5 className="font-medium text-nearblack mb-2">截图</h5>
          <ScreenshotViewer
            projectId={projectId}
            screenshots={report.screenshot_paths}
          />
        </div>
      )}

      {/* Feedback */}
      {report.feedback_for_generator && (
        <div>
          <h5 className="font-medium text-nearblack mb-2">反馈</h5>
          <div className="p-3 bg-warmAmberLight rounded-lg text-sm text-olive whitespace-pre-wrap leading-relaxed">
            {report.feedback_for_generator}
          </div>
        </div>
      )}
    </div>
  );
}
