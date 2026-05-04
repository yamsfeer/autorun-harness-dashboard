import { useEffect, useRef, useState } from 'react';

interface LogEntry {
  time: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'section';
  message: string;
}

interface LogViewerProps {
  content: string;
}

function parseLogs(content: string): LogEntry[] {
  const lines = content.split('\n');
  const entries: LogEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // 匹配时间戳格式 [HH:MM:SS] 或 2024-... 或 ISO 格式
    const timeMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)|^(\[\d{2}:\d{2}:\d{2}\])|^(\d{2}:\d{2}:\d{2})/);
    let time = '';
    let rest = line;

    if (timeMatch) {
      time = timeMatch[0].replace(/[\[\]]/g, '');
      rest = line.slice(timeMatch[0].length).trim();
    }

    // 判断日志级别
    let level: LogEntry['level'] = 'info';
    const lower = rest.toLowerCase();
    if (line.startsWith('##') || line.match(/^[\-=]{3,}$/)) {
      level = 'section';
    } else if (lower.includes('错误') || lower.includes('失败') || lower.includes('❌') || lower.includes('error') || lower.includes('exception')) {
      level = 'error';
    } else if (lower.includes('完成') || lower.includes('成功') || lower.includes('✓') || lower.includes('✅') || lower.includes('pass')) {
      level = 'success';
    } else if (lower.includes('警告') || lower.includes('⚠') || lower.includes('warning')) {
      level = 'warning';
    }

    entries.push({ time, level, message: line });
  }

  return entries;
}

const levelStyles: Record<LogEntry['level'], string> = {
  info: 'text-olive',
  success: 'text-warmGreen',
  warning: 'text-warmAmber',
  error: 'text-warmRed',
  section: 'text-charcoal font-semibold',
};

const levelBadge: Record<LogEntry['level'], { bg: string; text: string; label: string }> = {
  info: { bg: 'bg-borderCream', text: 'text-olive', label: 'INFO' },
  success: { bg: 'bg-warmGreen/20', text: 'text-warmGreen', label: 'OK' },
  warning: { bg: 'bg-warmAmber/20', text: 'text-warmAmber', label: 'WARN' },
  error: { bg: 'bg-warmRed/20', text: 'text-warmRed', label: 'ERR' },
  section: { bg: 'bg-warmAmberLight', text: 'text-warmAmber', label: '→' },
};

export default function LogViewer({ content }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const [filter, setFilter] = useState<LogEntry['level'] | 'all'>('all');

  useEffect(() => {
    if (containerRef.current && shouldAutoScroll.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [content]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    shouldAutoScroll.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  const entries = parseLogs(content);
  const filtered = filter === 'all' ? entries : entries.filter(e => e.level === filter);

  const counts = {
    all: entries.length,
    error: entries.filter(e => e.level === 'error').length,
    warning: entries.filter(e => e.level === 'warning').length,
    success: entries.filter(e => e.level === 'success').length,
    info: entries.filter(e => e.level === 'info').length,
    section: entries.filter(e => e.level === 'section').length,
  };

  return (
    <div className="h-full flex flex-col bg-warmAmberLight rounded-lg border border-warmAmber/20">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-warmAmber/20 shrink-0">
        <div className="flex items-center gap-1">
          {(['all', 'error', 'warning', 'success'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                filter === f
                  ? 'bg-warmAmber/30 text-warmAmber'
                  : 'text-olive hover:bg-warmAmber/10'
              }`}
            >
              {f === 'all' ? '全部' : f === 'error' ? '错误' : f === 'warning' ? '警告' : '成功'}
              <span className="ml-1 opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>
        <span className="text-xs text-olive/60">{entries.length} 行</span>
      </div>

      {/* Log entries */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-sm bg-parchment/50"
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-olive/60 text-sm">
            暂无日志
          </div>
        ) : (
          <div className="divide-y divide-warmAmber/10">
            {filtered.map((entry, idx) => {
              const badge = levelBadge[entry.level];
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2 px-3 py-1.5 hover:bg-warmSand/30 transition-colors ${levelStyles[entry.level]}`}
                >
                  <span className={`shrink-0 mt-0.5 px-1 py-0.5 rounded text-[10px] font-bold leading-none ${badge.bg} ${badge.text}`}>
                    {badge.label}
                  </span>
                  {entry.time && (
                    <span className="shrink-0 text-olive/50 text-xs mt-0.5 w-[60px]">
                      {entry.time}
                    </span>
                  )}
                  <span className="break-all whitespace-pre-wrap">
                    {entry.message.replace(/^\[?\d{2}:\d{2}:\d{2}\]?\s*/, '')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
