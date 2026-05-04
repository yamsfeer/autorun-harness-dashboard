import { useMemo, useState, useRef, useCallback } from 'react';
import type { Task } from '../stores/useStore';

interface TaskDependencyGraphProps {
  tasks: Task[];
}

// 计算曲线上指定位置的切线角度
function getTangentAngle(pathD: string, t: number): number {
  // 从 path 的 d 属性解析起点、控制点和终点
  const match = pathD.match(/M\s*([\d.]+)\s*([\d.]+)\s*C\s*([\d.]+)\s*([\d.]+),\s*([\d.]+)\s*([\d.]+),\s*([\d.]+)\s*([\d.]+)/);
  if (!match) return 0;

  const [, sx, sy, c1x, c1y, c2x, c2y, ex, ey] = match.map(Number);

  // 贝塞尔曲线导数公式
  const mt = 1 - t;
  const dx = 3 * mt * mt * (c1x - sx) + 6 * mt * t * (c2x - c1x) + 3 * t * t * (ex - c2x);
  const dy = 3 * mt * mt * (c1y - sy) + 6 * mt * t * (c2y - c1y) + 3 * t * t * (ey - c2y);

  return Math.atan2(dy, dx) * (180 / Math.PI);
}

// 生成空心箭头路径
function generateArrowPath(x: number, y: number, angle: number, size: number = 6): string {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 箭头点（相对于箭头尖端）
  const points = [
    { dx: 0, dy: 0 },           // 尖端
    { dx: -size, dy: -size/2 }, // 上边
    { dx: -size * 0.6, dy: 0 }, // 内折点
    { dx: -size, dy: size/2 },  // 下边
  ];

  const transformed = points.map(p => ({
    x: x + p.dx * cos - p.dy * sin,
    y: y + p.dx * sin + p.dy * cos
  }));

  return `M ${transformed[0].x} ${transformed[0].y} L ${transformed[1].x} ${transformed[1].y} L ${transformed[2].x} ${transformed[2].y} L ${transformed[3].x} ${transformed[3].y} Z`;
}

// 获取状态对应的颜色
function getStatusColors(status: Task['status']) {
  switch (status) {
    case 'completed': return { bg: 'bg-warmGreenLight', border: 'border-warmGreen', text: 'text-warmGreen', hex: '#4a7c42' };
    case 'in_progress': return { bg: 'bg-terracotta-light', border: 'border-terracotta', text: 'text-terracotta', hex: '#c96442' };
    case 'needs_human':
    case 'blocked': return { bg: 'bg-warmRedLight', border: 'border-warmRed', text: 'text-warmRed', hex: '#c75050' };
    default: return { bg: 'bg-borderCream', border: 'border-stone', text: 'text-stone', hex: '#8b8680' };
  }
}

export default function TaskDependencyGraph({ tasks }: TaskDependencyGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 构建依赖图数据
  const graphData = useMemo(() => {
    const nodes = tasks.map((task, index) => {
      const numMatch = task.id.match(/(\d+)/);
      const displayIndex = numMatch ? parseInt(numMatch[1]) : index + 1;

      return {
        id: task.id,
        label: `${displayIndex}`,
        title: task.title,
        status: task.status,
        priority: task.priority,
        description: task.description,
        acceptance_criteria: task.acceptance_criteria,
        dependencies: task.dependencies,
        displayIndex,
        attempts: task.attempts,
        assigned_to: task.assigned_to,
        completed_at: task.completed_at,
        notes: task.notes,
        category: task.category,
      };
    });

    const edges: { from: string; to: string }[] = [];
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        edges.push({ from: depId, to: task.id });
      }
    }

    const nodeDependencies = new Map<string, Set<string>>();
    const nodeDependents = new Map<string, Set<string>>();

    for (const node of nodes) {
      nodeDependencies.set(node.id, new Set());
      nodeDependents.set(node.id, new Set());
    }

    for (const edge of edges) {
      nodeDependencies.get(edge.to)?.add(edge.from);
      nodeDependents.get(edge.from)?.add(edge.to);
    }

    return { nodes, edges, nodeDependencies, nodeDependents };
  }, [tasks]);

  // 计算节点位置
  const layoutData = useMemo(() => {
    const { nodes, nodeDependencies } = graphData;

    const levels = new Map<string, number>();

    const getLevel = (nodeId: string): number => {
      if (levels.has(nodeId)) return levels.get(nodeId)!;

      const deps = nodeDependencies.get(nodeId) || new Set();
      if (deps.size === 0) {
        levels.set(nodeId, 0);
        return 0;
      }

      let maxLevel = 0;
      for (const dep of deps) {
        maxLevel = Math.max(maxLevel, getLevel(dep) + 1);
      }
      levels.set(nodeId, maxLevel);
      return maxLevel;
    };

    for (const node of nodes) {
      getLevel(node.id);
    }

    const levelGroups = new Map<number, typeof nodes>();
    for (const node of nodes) {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)!.push(node);
    }

    const nodePositions = new Map<string, { x: number; y: number }>();
    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 64;
    const LEVEL_GAP = 140;
    const NODE_GAP = 28;
    const PADDING = 60;

    let maxNodesInLevel = 0;
    for (const [, levelNodes] of levelGroups) {
      maxNodesInLevel = Math.max(maxNodesInLevel, levelNodes.length);
    }

    for (const [level, levelNodes] of levelGroups) {
      levelNodes.sort((a, b) => a.displayIndex - b.displayIndex);

      const startY = PADDING;

      levelNodes.forEach((node, idx) => {
        nodePositions.set(node.id, {
          x: PADDING + level * (NODE_WIDTH + LEVEL_GAP),
          y: startY + idx * (NODE_HEIGHT + NODE_GAP),
        });
      });
    }

    const maxLevel = Math.max(...Array.from(levels.values()), 0);
    const totalWidth = PADDING * 2 + (maxLevel + 1) * NODE_WIDTH + maxLevel * LEVEL_GAP;
    const totalHeight = PADDING * 2 + maxNodesInLevel * NODE_HEIGHT + (maxNodesInLevel - 1) * NODE_GAP;

    return { nodePositions, totalWidth, totalHeight, NODE_WIDTH, NODE_HEIGHT };
  }, [graphData]);

  // 计算高亮节点集合
  const highlightedNodes = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();

    const { nodeDependencies, nodeDependents } = graphData;
    const highlighted = new Set<string>([selectedNodeId]);

    const addDependencies = (nodeId: string) => {
      const deps = nodeDependencies.get(nodeId);
      if (deps) {
        for (const dep of deps) {
          highlighted.add(dep);
          addDependencies(dep);
        }
      }
    };

    const addDependents = (nodeId: string) => {
      const dependents = nodeDependents.get(nodeId);
      if (dependents) {
        for (const dep of dependents) {
          highlighted.add(dep);
          addDependents(dep);
        }
      }
    };

    addDependencies(selectedNodeId);
    addDependents(selectedNodeId);

    return highlighted;
  }, [selectedNodeId, graphData]);

  // 计算高亮边集合
  const highlightedEdges = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();

    const highlighted = new Set<string>();

    for (const edge of graphData.edges) {
      if (highlightedNodes.has(edge.from) && highlightedNodes.has(edge.to)) {
        highlighted.add(`${edge.from}->${edge.to}`);
      }
    }

    return highlighted;
  }, [selectedNodeId, graphData.edges, highlightedNodes]);

  // 获取选中节点的详细信息
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return graphData.nodes.find(n => n.id === selectedNodeId);
  }, [selectedNodeId, graphData.nodes]);

  // 拖拽事件处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCanvas = target === containerRef.current ||
                     target.tagName === 'svg' ||
                     target.closest('.canvas-background');

    if (isCanvas && !target.closest('.task-node') && !target.closest('.detail-panel')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x / zoom, y: e.clientY - pan.y / zoom });
    }
  }, [pan, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    setPan({
      x: (e.clientX - dragStart.x) * zoom,
      y: (e.clientY - dragStart.y) * zoom,
    });
  }, [isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.3), 3));
  }, []);

  const { nodes, edges } = graphData;
  const { nodePositions, totalWidth, totalHeight, NODE_WIDTH, NODE_HEIGHT } = layoutData;

  // 生成边的路径数据
  const generateEdgePaths = (fromX: number, fromY: number, toX: number, toY: number) => {
    const pathD = `M ${fromX} ${fromY} C ${fromX + 50} ${fromY}, ${toX - 50} ${toY}, ${toX} ${toY}`;
    const angle = getTangentAngle(pathD, 0.95);
    return { pathD, angle };
  };

  if (nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-olive text-sm">
        暂无任务
      </div>
    );
  }

  const hasDependencies = edges.length > 0;

  return (
    <div className="h-full flex relative">
      {/* 画布 */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ backgroundColor: '#faf9f5' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {!hasDependencies ? (
          <div className="h-full flex flex-col items-center justify-center text-olive">
            <svg className="w-16 h-16 mb-4 text-stone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <p className="text-sm">任务之间没有依赖关系</p>
            <p className="text-xs text-stone mt-1">所有任务都是独立的</p>
          </div>
        ) : (
          <div
            className="canvas-background relative"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: totalWidth,
              height: Math.max(totalHeight, 400),
            }}
          >
            {/* SVG 连线层 - 非高亮连线 */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: totalWidth, height: Math.max(totalHeight, 400) }}
            >
              {/* 非高亮连线 */}
              {edges.map((edge) => {
                const fromPos = nodePositions.get(edge.from);
                const toPos = nodePositions.get(edge.to);
                if (!fromPos || !toPos) return null;

                const isHighlighted = highlightedEdges.has(`${edge.from}->${edge.to}`);
                if (isHighlighted && selectedNodeId) return null;

                const startX = fromPos.x + NODE_WIDTH;
                const startY = fromPos.y + NODE_HEIGHT / 2;
                const endX = toPos.x;
                const endY = toPos.y + NODE_HEIGHT / 2;

                const isDimmed = selectedNodeId && !isHighlighted;
                const { pathD, angle } = generateEdgePaths(startX, startY, endX, endY);

                // 连线颜色以目标节点（入度）状态为准
                const toNode = graphData.nodes.find(n => n.id === edge.to);
                const edgeColor = toNode ? getStatusColors(toNode.status).hex : '#d1cfc5';
                const dimmedColor = '#e8e6dc';

                const arrowX = endX - 2;
                const arrowY = endY;

                return (
                  <g key={`${edge.from}->${edge.to}`}>
                    <path
                      d={pathD}
                      stroke={isDimmed ? dimmedColor : edgeColor}
                      strokeWidth={isDimmed ? 1 : 1.5}
                      fill="none"
                      className="transition-all duration-200"
                    />
                    {/* 空心箭头 */}
                    <path
                      d={generateArrowPath(arrowX, arrowY, angle, 5)}
                      stroke={isDimmed ? dimmedColor : edgeColor}
                      strokeWidth={isDimmed ? 1 : 1.2}
                      fill="none"
                      className="transition-all duration-200"
                    />
                  </g>
                );
              })}
            </svg>

            {/* 高亮连线层 - 在节点之上 */}
            {selectedNodeId && (
              <svg
                className="absolute top-0 left-0 pointer-events-none z-10"
                style={{ width: totalWidth, height: Math.max(totalHeight, 400) }}
              >
                {edges.map((edge) => {
                  const fromPos = nodePositions.get(edge.from);
                  const toPos = nodePositions.get(edge.to);
                  if (!fromPos || !toPos) return null;

                  const isHighlighted = highlightedEdges.has(`${edge.from}->${edge.to}`);
                  if (!isHighlighted) return null;

                  const startX = fromPos.x + NODE_WIDTH;
                  const startY = fromPos.y + NODE_HEIGHT / 2;
                  const endX = toPos.x;
                  const endY = toPos.y + NODE_HEIGHT / 2;

                  const { pathD, angle } = generateEdgePaths(startX, startY, endX, endY);
                  const arrowX = endX - 2;
                  const arrowY = endY;

                  // 高亮连线颜色也以目标节点状态为准
                  const toNode = graphData.nodes.find(n => n.id === edge.to);
                  const highlightColor = toNode ? getStatusColors(toNode.status).hex : '#c96442';

                  return (
                    <g key={`highlight-${edge.from}->${edge.to}`}>
                      <path
                        d={pathD}
                        stroke={highlightColor}
                        strokeWidth={2.5}
                        fill="none"
                        className="transition-all duration-200"
                      />
                      {/* 空心箭头 - 高亮 */}
                      <path
                        d={generateArrowPath(arrowX, arrowY, angle, 6)}
                        stroke={highlightColor}
                        strokeWidth={1.8}
                        fill="none"
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* 节点层 */}
            {nodes.map((node) => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;

              const colors = getStatusColors(node.status);
              const isHighlighted = highlightedNodes.has(node.id);
              const isSelected = selectedNodeId === node.id;
              const isDimmed = selectedNodeId && !isHighlighted;

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(node.id);
                  }}
                  className={`task-node absolute rounded-lg shadow-sm transition-all cursor-pointer group
                    ${isSelected ? 'ring-2 ring-offset-2 shadow-lg z-20' :
                      isHighlighted ? 'ring-2 z-15' : ''}
                    ${isDimmed ? 'opacity-30' : ''}
                  `}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: NODE_WIDTH,
                    height: NODE_HEIGHT,
                    zIndex: isSelected ? 20 : isHighlighted ? 15 : undefined,
                    // ring 颜色与节点状态一致
                    ...(isSelected || isHighlighted ? { 
                      '--tw-ring-color': colors.hex,
                      '--tw-ring-offset-color': '#faf9f5'
                    } as React.CSSProperties : {}),
                  }}
                >
                  <div className={`h-full flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 transition-all relative
                    ${colors.bg} ${colors.border}
                  `}>
                    {/* 序号 - 右上角小圆圈 */}
                    <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 shadow-sm
                      ${colors.bg} ${colors.text} ${colors.border}
                    `}>
                      {node.label}
                    </span>

                    {/* 状态 + 标题 */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[10px] font-medium ${colors.text}`}>
                          {node.status === 'completed' ? '完成' :
                           node.status === 'in_progress' ? '进行中' :
                           node.status === 'needs_human' || node.status === 'blocked' ? '需人工' : '待处理'}
                        </span>
                      </div>
                      <p className="text-xs truncate leading-tight text-olive">
                        {node.title}
                      </p>
                    </div>
                  </div>

                  {/* Tooltip - 只在没有选中节点时显示 */}
                  {!selectedNodeId && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-charcoal text-ivory text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap max-w-xs">
                      <div className="font-medium mb-1">{node.title}</div>
                      <div className="text-warmSilver">
                        状态: {node.status === 'completed' ? '已完成' :
                              node.status === 'in_progress' ? '进行中' :
                              node.status === 'needs_human' ? '需人工干预' :
                              node.status === 'blocked' ? '已阻塞' : '待处理'}
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-charcoal" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 右侧详情面板 */}
      {selectedNode && (
        <div 
          className={`detail-panel bg-ivory border-l border-borderCream shadow-lg overflow-y-auto flex-shrink-0 transition-all duration-300 relative ${isPanelCollapsed ? 'w-0 border-l-0' : 'w-80'}`}
        >
          {!isPanelCollapsed && (
            <div className="p-4">
              {/* 头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border-2
                    ${getStatusColors(selectedNode.status).bg}
                    ${getStatusColors(selectedNode.status).text}
                    ${getStatusColors(selectedNode.status).border}
                  `}>
                    {selectedNode.label}
                  </span>
                  <span className="text-xs text-stone uppercase tracking-wider">{selectedNode.id}</span>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 hover:bg-borderCream rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-stone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 标题 */}
              <h3 className="text-lg font-serif font-semibold text-nearblack mb-3 leading-tight">
                {selectedNode.title}
              </h3>

              {/* 状态和优先级 */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedNode.status === 'completed' ? 'bg-warmGreenLight text-warmGreen' :
                  selectedNode.status === 'in_progress' ? 'bg-terracotta-light text-terracotta' :
                  'bg-warmRedLight text-warmRed'
                }`}>
                  {selectedNode.status === 'completed' ? '已完成' :
                   selectedNode.status === 'in_progress' ? '进行中' :
                   selectedNode.status === 'needs_human' ? '需人工干预' :
                   selectedNode.status === 'blocked' ? '已阻塞' : '待处理'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedNode.priority === 'high' ? 'bg-warmRedLight text-warmRed' :
                  selectedNode.priority === 'medium' ? 'bg-warmAmberLight text-warmAmber' :
                  'bg-borderCream text-stone'
                }`}>
                  {selectedNode.priority === 'high' ? '高优先级' :
                   selectedNode.priority === 'medium' ? '中优先级' : '低优先级'}
                </span>
              </div>

              {/* 描述 */}
              {selectedNode.description && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">任务描述</h4>
                  <p className="text-sm text-olive leading-relaxed">{selectedNode.description}</p>
                </div>
              )}

              {/* 验收标准 */}
              {selectedNode.acceptance_criteria.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">
                    验收标准 ({selectedNode.acceptance_criteria.filter(ac => ac.status === 'pass').length}/{selectedNode.acceptance_criteria.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedNode.acceptance_criteria.map((ac) => (
                      <div
                        key={ac.id}
                        className={`flex items-start gap-2 p-2 rounded text-sm ${
                          ac.status === 'pass' ? 'bg-warmGreenLight/50' :
                          ac.status === 'fail' ? 'bg-warmRedLight/50' : 'bg-borderCream/50'
                        }`}
                      >
                        <span className="mt-0.5">
                          {ac.status === 'pass' ? (
                            <svg className="w-4 h-4 text-warmGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : ac.status === 'fail' ? (
                            <svg className="w-4 h-4 text-warmRed" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-stone" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="3" strokeWidth={2} />
                            </svg>
                          )}
                        </span>
                        <span className="text-olive">{ac.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 依赖关系 */}
              {selectedNode.dependencies.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">
                    前置依赖 ({selectedNode.dependencies.length})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.dependencies.map(depId => {
                      const depNode = graphData.nodes.find(n => n.id === depId);
                      return (
                        <span
                          key={depId}
                          className="px-2 py-0.5 bg-borderCream rounded text-xs text-stone cursor-pointer hover:bg-terracotta-light hover:text-terracotta transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(depId);
                          }}
                        >
                          {depNode ? `#${depNode.label}` : depId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 后置任务 */}
              {(() => {
                const dependents = Array.from(graphData.nodeDependents.get(selectedNode.id) || []);
                if (dependents.length === 0) return null;
                return (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">
                      后置任务 ({dependents.length})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {dependents.map(depId => {
                        const depNode = graphData.nodes.find(n => n.id === depId);
                        return (
                          <span
                            key={depId}
                            className="px-2 py-0.5 bg-borderCream rounded text-xs text-stone cursor-pointer hover:bg-terracotta-light hover:text-terracotta transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNodeId(depId);
                            }}
                          >
                            {depNode ? `#${depNode.label}` : depId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* 其他信息 */}
              <div className="pt-3 border-t border-borderCream space-y-2">
                {selectedNode.category && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone">分类</span>
                    <span className="text-olive">{selectedNode.category}</span>
                  </div>
                )}
                {selectedNode.assigned_to && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone">执行者</span>
                    <span className="text-olive">{selectedNode.assigned_to}</span>
                  </div>
                )}
                {selectedNode.attempts > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone">尝试次数</span>
                    <span className="text-olive">{selectedNode.attempts}</span>
                  </div>
                )}
                {selectedNode.completed_at && (
                  <div className="flex justify-between text-xs">
                    <span className="text-stone">完成时间</span>
                    <span className="text-olive">{new Date(selectedNode.completed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* 备注 */}
              {selectedNode.notes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-borderCream">
                  <h4 className="text-xs font-medium text-stone uppercase tracking-wider mb-2">备注</h4>
                  <div className="space-y-1">
                    {selectedNode.notes.map((note) => (
                      <p key={note} className="text-xs text-stone">• {note}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 折叠按钮 - 固定在面板右侧边缘 */}
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="absolute top-1/2 -translate-y-1/2 -left-5 w-5 h-10 bg-ivory border border-borderCream rounded-l-md shadow-sm flex items-center justify-center hover:bg-borderCream transition-colors z-30"
            title={isPanelCollapsed ? '展开面板' : '折叠面板'}
          >
            <svg 
              className={`w-3 h-3 text-stone transition-transform ${isPanelCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* 图例 - 左下角 */}
      <div className="absolute left-4 bottom-4 bg-ivory/95 backdrop-blur-sm rounded-lg border border-borderCream p-2 shadow-sm z-20">
        <div className="flex flex-col gap-1.5 text-[10px] text-stone">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-warmGreenLight border border-warmGreen" />
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-terracotta-light border border-terracotta" />
            <span>进行中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-warmRedLight border border-warmRed" />
            <span>需人工</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-borderCream border border-stone" />
            <span>待处理</span>
          </div>
        </div>
      </div>
    </div>
  );
}
