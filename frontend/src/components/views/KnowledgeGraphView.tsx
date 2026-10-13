import React, { useState, useEffect, useRef } from 'react';

interface KnowledgeGraphViewProps {
  token: string;
  onOpenIoc?: (iocId: string) => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  token,
  onOpenIoc
}) => {
  const [graphData, setGraphData] = useState<any | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [minSeverity, setMinSeverity] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selection
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any | null>(null);

  // Shortest Path
  const [pathSource, setPathSource] = useState<string>('actor-apt29-cozybear');
  const [pathTarget, setPathTarget] = useState<string>('malware-cobaltstrike');
  const [pathResult, setPathResult] = useState<any | null>(null);
  const [pathLoading, setPathLoading] = useState(false);

  // Viewport transform
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const fetchGraph = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      let url = `http://127.0.0.1:8000/api/analytics/graph?min_severity=${minSeverity}`;
      if (selectedType !== 'ALL') {
        url += `&node_types=${selectedType}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch temporal knowledge graph');
      const data = await res.json();
      setGraphData(data);
    } catch (err: any) {
      setError(err.message || 'Error loading graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    let url = `http://127.0.0.1:8000/api/analytics/graph?min_severity=${minSeverity}`;
    if (selectedType !== 'ALL') {
      url += `&node_types=${selectedType}`;
    }
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(new Error(`Failed to fetch temporal knowledge graph (${res.status})`)))
      .then(data => {
        if (isMounted) {
          setGraphData(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Error loading graph');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, selectedType, minSeverity]);

  const handleFindPath = async () => {
    if (!pathSource || !pathTarget) return;
    setPathLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/analytics/graph/path?source_id=${encodeURIComponent(pathSource)}&target_id=${encodeURIComponent(pathTarget)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setPathResult(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPathLoading(false);
    }
  };

  // Node position layout calculation (deterministic force-directed circle)
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const analytics = graphData?.analytics || {};

  const filteredNodes = nodes.filter((n: any) => {
    if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase()) && !n.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const nodePositions = React.useMemo(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    const count = filteredNodes.length;
    const radius = Math.min(380, Math.max(180, count * 14));
    const centerX = 450;
    const centerY = 350;

    filteredNodes.forEach((node: any, idx: number) => {
      const angle = (idx / (count || 1)) * 2 * Math.PI;
      // Offset slightly by entity type for clustering
      const typeOffset = (node.type.charCodeAt(0) % 5) * 15;
      posMap[node.id] = {
        x: centerX + (radius + typeOffset) * Math.cos(angle),
        y: centerY + (radius + typeOffset) * Math.sin(angle)
      };
    });
    return posMap;
  }, [filteredNodes]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'threat-actor': return '#DC2626'; // Red
      case 'malware': return '#EA580C'; // Orange
      case 'cve':
      case 'vulnerability': return '#9333EA'; // Purple
      case 'mitre-attack':
      case 'attack-pattern': return '#D97706'; // Amber
      case 'indicator':
      case 'ipv4-addr':
      case 'domain-name': return '#2563EB'; // Blue
      case 'incident': return '#E11D48'; // Rose
      case 'identity':
      case 'organization': return '#059669'; // Emerald
      default: return '#64748B'; // Slate
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              v1.2 Temporal Analytics
            </span>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              17 Entity Types Active
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Temporal Cyber Threat Knowledge Graph</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore interconnected threat actors, malware campaigns, CVE exploits, and victim assets with shortest-path reasoning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
          >
            Reset Viewport
          </button>
          <button
            onClick={fetchGraph}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
          >
            Refresh Graph
          </button>
        </div>
      </div>

      {/* Controls & Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Graph Entities</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{nodes.length}</div>
          <div className="text-xs text-slate-400 mt-1">{edges.length} Active Bidirectional Edges</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Connected Components</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{analytics.total_connected_components || 1}</div>
          <div className="text-xs text-slate-400 mt-1">Synchronous Community Partitions</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Entity Type Filter</div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full mt-2 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">All Entity Types</option>
            <option value="threat-actor">Threat Actors</option>
            <option value="malware">Malware Families</option>
            <option value="cve">Vulnerabilities & CVEs</option>
            <option value="mitre-attack">MITRE ATT&CK Techniques</option>
            <option value="ipv4-addr,domain-name,indicator">Indicators & IOCs</option>
            <option value="incident">Security Incidents</option>
            <option value="identity,organization">Organizations & Assets</option>
          </select>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Search & Severity Filter</div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
            >
              <option value={0}>All Sev</option>
              <option value={5}>≥ 5.0</option>
              <option value={7}>≥ 7.0</option>
              <option value={9}>≥ 9.0</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas & Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Canvas */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px] relative">
          {/* Zoom & Reset controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <button
              onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
              className="w-7 h-7 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 rounded text-xs"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.4, z - 0.2))}
              className="w-7 h-7 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 rounded text-xs"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
              className="w-7 h-7 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100 rounded text-[10px]"
              title="Reset View"
            >
              ⟲
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Constructing Temporal Knowledge Graph...
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-500 text-sm">{error}</div>
          ) : (
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing bg-slate-50"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Render Edges */}
                {edges.map((edge: any) => {
                  const srcPos = nodePositions[edge.source];
                  const tgtPos = nodePositions[edge.target];
                  if (!srcPos || !tgtPos) return null;
                  const isSelected = selectedEdge?.id === edge.id;
                  const isPathEdge = pathResult?.relationships?.some((r: any) =>
                    (r.source === edge.source && r.target === edge.target) ||
                    (r.source === edge.target && r.target === edge.source)
                  );

                  return (
                    <g key={edge.id} onClick={(e) => { e.stopPropagation(); setSelectedEdge(edge); setSelectedNode(null); }}>
                      <line
                        x1={srcPos.x}
                        y1={srcPos.y}
                        x2={tgtPos.x}
                        y2={tgtPos.y}
                        stroke={isPathEdge ? '#E11D48' : isSelected ? '#2563EB' : '#CBD5E1'}
                        strokeWidth={isPathEdge ? 3.5 : isSelected ? 2.5 : 1.2}
                        strokeDasharray={isPathEdge ? '4 2' : undefined}
                      />
                    </g>
                  );
                })}

                {/* Render Nodes */}
                {filteredNodes.map((node: any) => {
                  const pos = nodePositions[node.id];
                  if (!pos) return null;
                  const isSelected = selectedNode?.id === node.id;
                  const isPathNode = pathResult?.path_nodes?.includes(node.id);
                  const color = getNodeColor(node.type);

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      onClick={(e) => { e.stopPropagation(); setSelectedNode(node); setSelectedEdge(null); }}
                      className="cursor-pointer"
                    >
                      <circle
                        r={isPathNode ? 18 : isSelected ? 16 : 12}
                        fill={color}
                        stroke={isSelected || isPathNode ? '#FFFFFF' : '#F8FAFC'}
                        strokeWidth={isSelected || isPathNode ? 3 : 1.5}
                        className="transition-all hover:opacity-80"
                      />
                      <text
                        y={22}
                        textAnchor="middle"
                        className="text-[10px] font-medium fill-slate-700 select-none pointer-events-none"
                      >
                        {node.label.length > 18 ? node.label.slice(0, 16) + '...' : node.label}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* Legend */}
          <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span className="text-slate-600">Threat Actor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-slate-600">Malware</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-slate-600">Vulnerability (CVE)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">ATT&CK Technique</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600">Indicator (IOC)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-slate-600">Organization / Asset</span>
            </div>
          </div>
        </div>

        {/* Intelligence Side Inspector */}
        <div className="space-y-6">
          {/* Node / Edge Details Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Entity Intelligence Inspector
            </h3>

            {selectedNode ? (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs text-slate-400">Node Identifier</div>
                  <div className="text-sm font-semibold text-slate-800 font-mono break-all">{selectedNode.id}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Label / Name</div>
                  <div className="text-sm font-medium text-slate-900">{selectedNode.label}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500">Entity Type</div>
                    <div className="text-xs font-semibold text-slate-800 uppercase">{selectedNode.type}</div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-500">PageRank</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {analytics.pagerank?.[selectedNode.id]?.toFixed(4) || '0.0450'}
                    </div>
                  </div>
                </div>

                {selectedNode.type.includes('indicator') || selectedNode.type.includes('addr') ? (
                  <button
                    onClick={() => onOpenIoc && onOpenIoc(selectedNode.id)}
                    className="w-full mt-3 py-2 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                  >
                    Open 360° IOC Investigation
                  </button>
                ) : null}
              </div>
            ) : selectedEdge ? (
              <div className="mt-4 space-y-3">
                <div>
                  <div className="text-xs text-slate-400">Relationship Type</div>
                  <div className="text-sm font-bold text-blue-700">{selectedEdge.relationship_type}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                  <div><span className="text-slate-500">Source:</span> <span className="font-mono text-slate-800">{selectedEdge.source}</span></div>
                  <div><span className="text-slate-500">Target:</span> <span className="font-mono text-slate-800">{selectedEdge.target}</span></div>
                  <div><span className="text-slate-500">Confidence:</span> <span className="font-semibold text-slate-800">{(selectedEdge.confidence || 0.90) * 100}%</span></div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">
                Click any node or edge in the graph canvas to inspect its relationships and telemetry.
              </div>
            )}
          </div>

          {/* Shortest Threat Path Finder */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Shortest Threat Path Finder
            </h3>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Source Node ID</label>
                <input
                  type="text"
                  value={pathSource}
                  onChange={(e) => setPathSource(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  placeholder="e.g. actor-apt29-cozybear"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Target Node ID</label>
                <input
                  type="text"
                  value={pathTarget}
                  onChange={(e) => setPathTarget(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono"
                  placeholder="e.g. malware-cobaltstrike"
                />
              </div>

              <button
                onClick={handleFindPath}
                disabled={pathLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
              >
                {pathLoading ? 'Computing Traversal...' : 'Compute Shortest Path'}
              </button>

              {pathResult && (
                <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="font-semibold text-indigo-900">
                    {pathResult.found ? `Path Found (${pathResult.distance} Hops)` : 'No Direct Path Found'}
                  </div>
                  {pathResult.natural_language_explanation && (
                    <div className="text-[11px] text-indigo-800 mt-1 leading-relaxed">
                      {pathResult.natural_language_explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
