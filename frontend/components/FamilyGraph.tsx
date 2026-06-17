'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Maximize2,
  Users,
  X,
  ChevronRight,
  Info,
  Plus,
  GitBranch,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getFullGraph } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- Types ---
interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  gender?: string;
  categories: string[];
  notes?: string;
  nickname?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  relation: string;
  relation_label?: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

// --- Constants ---
const NODE_RADIUS = 22;
const COLORS = {
  family: '#d48b3a', // amber
  friend: '#6366f1', // indigo/blue
  professional: '#10b981', // emerald/teal
  other: '#94a3b8', // slate
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getCategoryColor = (categories: string[]) => {
  if (categories.includes('Family') || categories.includes('family')) return COLORS.family;
  if (categories.includes('Friend') || categories.includes('friend')) return COLORS.friend;
  if (categories.includes('Professional') || categories.includes('Colleague') || categories.includes('professional')) return COLORS.professional;
  return COLORS.other;
};

// --- Component ---
export default function FamilyGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filter, setFilter] = useState('all');
  const [nodeCount, setNodeCount] = useState(0);

  // View Mode: 'graph' or 'tree'
  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('graph');
  const [treeRootId, setTreeRootId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Simulation ref to access across effects
  const simulationRef = useRef<d3.Simulation<Node, Link>>();
  const gRef = useRef<SVGGElement>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await getFullGraph();
        const graphData = json as unknown as GraphData;
        setData(graphData);
        
        if (graphData.nodes && graphData.nodes.length > 0) {
          // Find Siddharth/You or default to first node
          const defaultRoot = graphData.nodes.find((n: Node) => 
            n.name.toLowerCase().includes('siddharth') || 
            n.name.toLowerCase().includes('you')
          ) || graphData.nodes[0];
          setTreeRootId(defaultRoot.id);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    if (filter === 'all') return data;

    const familyKeywords = ['father', 'mother', 'brother', 'sister', 'spouse', 'son', 'daughter', 'uncle', 'aunt', 'cousin', 'grandfather', 'grandmother', 'nephew', 'niece', 'chithi', 'chithappa', 'periyamma', 'periyappa', 'mama', 'athai', 'thatha', 'paatti', 'anna', 'akka', 'thambi', 'thangachi', 'chacha', 'mausi', 'bhai', 'bhaiya', 'didi', 'dada', 'dadi', 'nana', 'nani', 'tau', 'tayi', 'phuphi', 'bhabhi', 'jiju', 'saali', 'sala', 'perrima', 'perrippa', 'atthai', 'wife', 'husband'];
    const friendKeywords = ['friend', 'buddy', 'acquaintance', 'pal'];
    const proKeywords = ['colleague', 'manager', 'mentor', 'client', 'coworker', 'boss', 'work'];

    const implicitNodes = new Set<string>();

    data.links.forEach(l => {
      const relText = ((l.relation_label || '') + ' ' + (l.relation || '')).toLowerCase();
      let match = false;
      if (filter === 'family' && familyKeywords.some(kw => relText.includes(kw))) match = true;
      else if (filter === 'friend' && friendKeywords.some(kw => relText.includes(kw))) match = true;
      else if (filter === 'professional' && proKeywords.some(kw => relText.includes(kw))) match = true;

      if (match) {
        implicitNodes.add(typeof l.source === 'string' ? l.source : (l.source as Node).id);
        implicitNodes.add(typeof l.target === 'string' ? l.target : (l.target as Node).id);
      }
    });

    const nodes = data.nodes.filter(n => 
      n.categories.some(c => c.toLowerCase() === filter.toLowerCase()) || 
      implicitNodes.has(n.id) ||
      n.id === treeRootId
    );
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = data.links.filter(l =>
      nodeIds.has(typeof l.source === 'string' ? l.source : (l.source as Node).id) &&
      nodeIds.has(typeof l.target === 'string' ? l.target : (l.target as Node).id)
    );

    return { nodes, links };
  }, [data, filter, treeRootId]);

  useEffect(() => {
    setNodeCount(filteredData.nodes.length);
  }, [filteredData]);

  // Recursively build tree projection string
  const treeProjection = useMemo(() => {
    if (!data || !treeRootId) return '';
    const d = data; // capture non-null reference for use in nested function
    const visited = new Set<string>([treeRootId]);
    
    function getSubtree(nodeId: string, prefix: string): string {
      // Find connections originating from or leading to this node
      const connected = d.links.filter(l => {
        const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        return srcId === nodeId || tgtId === nodeId;
      });

      let result = '';
      const unvisitedLinks = connected.filter(l => {
        const srcId = typeof l.source === 'string' ? l.source : (l.source as any).id;
        const tgtId = typeof l.target === 'string' ? l.target : (l.target as any).id;
        const neighborId = srcId === nodeId ? tgtId : srcId;
        return !visited.has(neighborId);
      });

      unvisitedLinks.forEach((link, idx) => {
        const srcId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const tgtId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        const isOutgoing = srcId === nodeId;
        const neighborId = isOutgoing ? tgtId : srcId;
        
        visited.add(neighborId);
        const neighborNode = d.nodes.find(n => n.id === neighborId);
        if (neighborNode) {
          const isLast = idx === unvisitedLinks.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          const displayRel = link.relation_label || link.relation;
          const relationStr = isOutgoing ? displayRel : `related (${displayRel})`;
          
          result += `${prefix}${connector}──(${relationStr})──➔ ${neighborNode.name}${neighborNode.nickname ? ` (${neighborNode.nickname})` : ''}\n`;
          
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          result += getSubtree(neighborId, nextPrefix);
        }
      });
      return result;
    }

    const rootNode = d.nodes.find(n => n.id === treeRootId);
    if (!rootNode) return 'No starting person found.';
    return `${rootNode.name}${rootNode.nickname ? ` (${rootNode.nickname})` : ''}\n` + getSubtree(treeRootId, '');
  }, [data, treeRootId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(treeProjection);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // D3 Implementation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || loading || !data || viewMode !== 'graph') return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('class', 'main-g');
    // @ts-expect-error – gRef holds the raw SVGGElement from d3 selection
    gRef.current = g.node();

    // Zoom setup
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Simulation setup
    const simulation = d3.forceSimulation<Node, Link>(filteredData.nodes)
      .force('link', d3.forceLink<Node, Link>(filteredData.links).id((d) => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(NODE_RADIUS * 2.5));

    simulationRef.current = simulation;

    // --- Draw Links (Edges) ---
    const link = g.append('g')
      .selectAll('line')
      .data(filteredData.links)
      .enter()
      .append('line')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('class', 'link-line');

    // --- Draw Link Labels (Edges descriptions) ---
    const linkLabelGroup = g.append('g')
      .selectAll('g')
      .data(filteredData.links)
      .enter()
      .append('g')
      .attr('class', 'link-label-group');

    linkLabelGroup.append('rect')
      .attr('fill', '#09090b')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('stroke', '#475569')
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.95);

    linkLabelGroup.append('text')
      .attr('font-size', '9px')
      .attr('fill', '#fbbf24') // amber text
      .attr('font-weight', '700')
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'middle')
      .attr('dy', '0.3em')
      .text(d => d.relation_label || d.relation);

    // Set background rect size based on text dimension
    linkLabelGroup.each(function() {
      const group = d3.select(this);
      const textNode = group.select<SVGTextElement>('text').node();
      if (textNode) {
        const bbox = textNode.getBBox();
        group.select('rect')
          .attr('x', bbox.x - 6)
          .attr('y', bbox.y - 2)
          .attr('width', bbox.width + 12)
          .attr('height', bbox.height + 4);
      }
    });

    // --- Draw Nodes ---
    const node = g.append('g')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .call(d3.drag<SVGGElement, Node>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .on('dblclick', (event, d) => {
        window.location.href = `/people/${d.id}`;
      });

    // Hover effect
    node.on('mouseenter', function (event, d) {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', NODE_RADIUS + 4)
        .attr('stroke-width', 3);

      d3.select(this).append('text')
        .attr('class', 'hover-label')
        .attr('y', NODE_RADIUS + 22)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text(d.name);
    }).on('mouseleave', function () {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', NODE_RADIUS)
        .attr('stroke-width', 1.5);

      d3.select(this).selectAll('.hover-label').remove();
    });

    // Inner node circle
    node.append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', d => getCategoryColor(d.categories))
      .attr('stroke', '#09090b')
      .attr('stroke-width', 1.5)
      .attr('class', 'node-circle');

    // Initials
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('pointer-events', 'none')
      .text(d => getInitials(d.name));

    // Simulation Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      linkLabelGroup.attr('transform', (d) => {
        const x = ((d.source as Node).x! + (d.target as Node).x!) / 2;
        const y = ((d.source as Node).y! + (d.target as Node).y!) / 2;
        return `translate(${x},${y})`;
      });

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Handle global click to deselect
    svg.on('click', () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };
  }, [filteredData, loading, viewMode, data]);

  const resetZoom = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(750).call(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
  };

  if (loading) {
    return (
      <div className="w-full h-[600px] bg-[#0f0e0d] flex items-center justify-center rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 skeleton-bg opacity-10 animate-pulse" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-16 h-16 rounded-full border-2 border-amber/30 border-t-amber animate-spin" />
          <p className="text-amber/60 text-sm font-medium tracking-widest uppercase">Initializing Neural Mapper...</p>
        </div>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="w-full h-[600px] bg-[#0f0e0d] flex flex-col items-center justify-center rounded-2xl border border-white/5">
        <div className="w-24 h-24 mb-6 text-amber/20">
          <Users size={96} strokeWidth={1} />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Build your network</h3>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Add your first family member or friend to start visualizing your relationship network.
        </p>
        <Button className="bg-amber hover:bg-amber-light text-black font-semibold rounded-full px-8">
          <Plus className="mr-2 h-4 w-4" />
          Add Person
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[650px] bg-[#0f0e0d] rounded-2xl border border-white/5 overflow-hidden font-body" ref={containerRef}>
      {/* Header controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none gap-4 flex-wrap">
        <div className="flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5">
          <Users size={15} className="text-amber" />
          <span className="text-xs font-semibold text-white/90">{nodeCount} People</span>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <Select value={filter} onValueChange={(value: string | null) => value && setFilter(value)}>
            <SelectTrigger className="w-[130px] h-7 bg-transparent border-none text-xs text-white/70 hover:text-white focus:ring-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-black/95 border-white/10 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="friend">Friends</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1">
          <button
            onClick={() => setViewMode('graph')}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold transition-all",
              viewMode === 'graph' ? "bg-amber text-black" : "text-white/60 hover:text-white"
            )}
          >
            Visual Graph
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold transition-all",
              viewMode === 'tree' ? "bg-amber text-black" : "text-white/60 hover:text-white"
            )}
          >
            Tree Projection
          </button>
        </div>

        {viewMode === 'graph' && (
          <div className="pointer-events-auto">
            <Button
              variant="outline"
              size="icon"
              onClick={resetZoom}
              className="rounded-full h-8 w-8 bg-black/40 backdrop-blur-md border-white/10 hover:bg-white/5 text-white/70"
            >
              <Maximize2 size={14} />
            </Button>
          </div>
        )}
      </div>

      {/* Main Panel View */}
      {viewMode === 'graph' ? (
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      ) : (
        <div className="w-full h-full pt-20 px-6 pb-6 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GitBranch size={18} className="text-amber" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-bold uppercase tracking-wider">Project Tree From:</span>
                <Select value={treeRootId} onValueChange={(val) => val && setTreeRootId(val)}>
                  <SelectTrigger className="w-[200px] h-8 bg-white/5 border-white/10 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/10 text-white max-h-[300px]">
                    {data.nodes.map(n => (
                      <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-white/80 gap-2 rounded-xl text-xs"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Tree"}
            </Button>
          </div>

          <div className="flex-1 glass-card rounded-2xl border border-white/5 p-6 bg-zinc-950/60 overflow-auto font-mono text-xs leading-relaxed text-amber-100/90 whitespace-pre">
            {treeProjection || "No connections found for this person."}
          </div>
        </div>
      )}

      {/* Side Detail Panel (Only for graph mode) */}
      {viewMode === 'graph' && (
        <div
          className={cn(
            "absolute top-4 right-4 bottom-4 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl transform transition-transform duration-500 ease-out z-30 flex flex-col shadow-2xl overflow-hidden",
            selectedNode ? "translate-x-0" : "translate-x-[calc(100%+20px)]"
          )}
        >
          {selectedNode && (
            <>
              <div className="p-6 relative">
                <button
                  onClick={() => setSelectedNode(null)}
                  className="absolute top-4 right-4 p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>

                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-4"
                  style={{
                    backgroundColor: `${getCategoryColor(selectedNode.categories)}22`,
                    border: `2px solid ${getCategoryColor(selectedNode.categories)}44`,
                    color: getCategoryColor(selectedNode.categories)
                  }}
                >
                  {getInitials(selectedNode.name)}
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight leading-none mb-1">
                  {selectedNode.name}
                </h3>
                {selectedNode.nickname && (
                  <p className="text-amber/90 text-sm font-medium mb-4">&quot;{selectedNode.nickname}&quot;</p>
                )}

                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedNode.categories.map(cat => (
                    <span
                      key={cat}
                      className="px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider"
                      style={{
                        backgroundColor: `${getCategoryColor([cat])}22`,
                        color: getCategoryColor([cat]),
                        border: `1px solid ${getCategoryColor([cat])}33`
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <Info size={12} className="text-amber/60" />
                    Notes
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed font-light italic">
                    {selectedNode.notes || "No additional notes for this person."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <Maximize2 size={12} className="text-amber/60" />
                    Relation Data
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-white/60">Gender: <span className="text-white font-medium ml-1 capitalize">{selectedNode.gender || 'Unknown'}</span></p>
                    <p className="text-xs text-white/60 mt-1">Status: <span className="text-emerald-400 font-medium ml-1">Active Neural Node</span></p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/[0.02] border-t border-white/5">
                <Link href={`/people/${selectedNode.id}`} className="block">
                  <Button className="w-full bg-white hover:bg-amber text-black font-bold h-11 rounded-xl group">
                    View Full Profile
                    <ChevronRight size={16} className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .skeleton-bg {
          background: radial-gradient(circle at center, #d48b3a 0%, transparent 70%);
        }
        :global(.node-group) {
          cursor: pointer;
        }
        :global(.node-group:hover .node-circle) {
          filter: drop-shadow(0 0 8px rgba(212, 139, 58, 0.4));
        }
      `}</style>
    </div>
  );
}
