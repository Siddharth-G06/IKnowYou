'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Maximize2,
  Users,
  X,
  ChevronRight,
  Info,
  Plus
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
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

// --- Constants ---
const NODE_RADIUS = 20;
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
  if (categories.includes('Family')) return COLORS.family;
  if (categories.includes('Friend')) return COLORS.friend;
  if (categories.includes('Professional') || categories.includes('Colleague')) return COLORS.professional;
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

  // Simulation ref to access across effects
  const simulationRef = useRef<d3.Simulation<Node, Link>>();
  const gRef = useRef<SVGGElement>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const json = await getFullGraph();
        setData(json as unknown as GraphData);
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

    const nodes = data.nodes.filter(n => n.categories.some(c => c.toLowerCase() === filter.toLowerCase()));
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = data.links.filter(l =>
      nodeIds.has(typeof l.source === 'string' ? l.source : (l.source as Node).id) &&
      nodeIds.has(typeof l.target === 'string' ? l.target : (l.target as Node).id)
    );

    return { nodes, links };
  }, [data, filter]);

  useEffect(() => {
    setNodeCount(filteredData.nodes.length);
  }, [filteredData]);

  // D3 Implementation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || loading || !data) return;

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
      .force('link', d3.forceLink<Node, Link>(filteredData.links).id((d) => d.id).distance(150))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(NODE_RADIUS * 2));

    simulationRef.current = simulation;

    // --- Draw Links ---
    const link = g.append('g')
      .selectAll('path')
      .data(filteredData.links)
      .enter()
      .append('path')
      .attr('stroke', '#4a4540')
      .attr('stroke-width', 2)
      .attr('fill', 'none')
      .attr('class', 'link-path');

    const linkLabels = g.append('g')
      .selectAll('text')
      .data(filteredData.links)
      .enter()
      .append('text')
      .attr('font-size', '10px')
      .attr('fill', '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('dy', -5)
      .text(d => d.relation);

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
        .attr('y', NODE_RADIUS + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '12px')
        .attr('font-weight', '500')
        .text(d.name);
    }).on('mouseleave', function () {
      d3.select(this).select('circle')
        .transition().duration(200)
        .attr('r', NODE_RADIUS)
        .attr('stroke-width', 1.5);

      d3.select(this).selectAll('.hover-label').remove();
    });

    // Outer ring for selected
    node.append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', d => getCategoryColor(d.categories))
      .attr('stroke', '#0f0e0d')
      .attr('stroke-width', 1.5)
      .attr('class', 'node-circle');

    // Initials
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('pointer-events', 'none')
      .text(d => getInitials(d.name));

    // Simulation Tick
    simulation.on('tick', () => {
      link.attr('d', (d) => {
        const dx = (d.target as Node).x! - (d.source as Node).x!;
        const dy = (d.target as Node).y! - (d.source as Node).y!;
        const dr = Math.sqrt(dx * dx + dy * dy);
        return `M${(d.source as Node).x},${(d.source as Node).y}A${dr},${dr} 0 0,1 ${(d.target as Node).x},${(d.target as Node).y}`;
      });

      linkLabels.attr('x', (d) => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr('y', (d) => ((d.source as Node).y! + (d.target as Node).y!) / 2);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredData, loading]);

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
      {/* Search & Controls Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2">
          <Users size={16} className="text-amber" />
          <span className="text-sm font-medium text-white/90">{nodeCount} People</span>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <Select value={filter} onValueChange={(value: string | null) => value && setFilter(value)}>
            <SelectTrigger className="w-[140px] h-8 bg-transparent border-none text-xs text-white/70 hover:text-white focus:ring-0">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="family">Family</SelectItem>
              <SelectItem value="friend">Friends</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={resetZoom}
            className="rounded-full bg-black/40 backdrop-blur-md border-white/10 hover:bg-white/5 text-white/70"
          >
            <Maximize2 size={16} />
          </Button>
        </div>
      </div>

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Side Detail Panel */}
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

      <style jsx>{`
        .skeleton-bg {
          background: radial-gradient(circle at center, #d48b3a 0%, transparent 70%);
        }
        :global(.node-group) {
          cursor: pointer;
        }
        :global(.link-path) {
          transition: stroke 0.3s;
        }
        :global(.node-group:hover .node-circle) {
          filter: drop-shadow(0 0 8px rgba(212, 139, 58, 0.4));
        }
      `}</style>
    </div>
  );
}
