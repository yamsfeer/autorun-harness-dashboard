import { useEffect, useRef } from 'react';

interface LogViewerProps {
  content: string;
}

export default function LogViewer({ content }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);

  useEffect(() => {
    if (containerRef.current && shouldAutoScroll.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // 如果滚动到底部附近，启用自动滚动
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  // 解析日志内容
  const parseLog = (log: string) => {
    const lines = log.split('\n');
    return lines.map((line, idx) => {
      let className = 'text-gray-600';

      // 高亮错误
      if (line.includes('错误') || line.includes('失败') || line.includes('❌')) {
        className = 'text-red-600';
      }
      // 高亮成功
      else if (line.includes('完成') || line.includes('成功') || line.includes('✓') || line.includes('✅')) {
        className = 'text-green-600';
      }
      // 高亮警告
      else if (line.includes('警告') || line.includes('⚠')) {
        className = 'text-yellow-600';
      }
      // 高亮标题
      else if (line.startsWith('##')) {
        className = 'text-gray-900 font-semibold';
      }

      return (
        <div key={idx} className={`${className} whitespace-pre-wrap`}>
          {line}
        </div>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full bg-gray-900 text-gray-100 p-4 font-mono text-sm overflow-y-auto rounded-lg"
    >
      {content ? (
        parseLog(content)
      ) : (
        <div className="text-gray-500">暂无日志</div>
      )}
    </div>
  );
}
