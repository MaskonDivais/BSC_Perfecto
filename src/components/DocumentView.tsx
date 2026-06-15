import React, { useState, useMemo, useRef } from 'react';
import { StoryNode, Connection } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  Search, 
  FileText, 
  ChevronRight, 
  Image as ImageIcon, 
  ArrowDown, 
  Layers, 
  Download, 
  Hash, 
  BookOpen,
  AlignLeft
} from 'lucide-react';

interface DocumentViewProps {
  projectName: string;
  nodes: StoryNode[];
  connections: Connection[];
  theme: 'cosmic' | 'warm';
}

export default function DocumentView({ projectName, nodes, connections, theme }: DocumentViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const documentContainerRef = useRef<HTMLDivElement>(null);

  const getEffectiveType = (node: StoryNode): 'start' | 'end' | 'variation' | 'description' => {
    if (node.nodeType) return node.nodeType;
    const color = (node.borderColor || '').toLowerCase();
    if (color === '#10b981' || color.includes('green')) return 'start';
    if (color === '#ef4444' || color === '#dc2626' || color.includes('red')) return 'end';
    if (color === '#f97316' || color === '#ea580c' || color.includes('orange')) return 'variation';
    if (color === '#3b82f6' || color === '#0284c7' || color.includes('blue')) return 'description';
    if (node.tag === 'dialogue' || node.tag === 'variation') return 'variation';
    return 'description';
  };

  const TYPE_COLORS: Record<string, string> = {
    start: '#10b981',       // Green
    end: '#ef4444',         // Red
    variation: '#f97316',    // Orange
    description: '#3b82f6', // Blue
  };

  // Sort nodes relative to their logical structure or visually Y, then X
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => {
      // Prioritize primary node root
      if (a.id === 'node_root') return -1;
      if (b.id === 'node_root') return 1;

      const aType = getEffectiveType(a);
      const bType = getEffectiveType(b);

      // Start always goes to the top
      if (aType === 'start' && bType !== 'start') return -1;
      if (bType === 'start' && aType !== 'start') return 1;

      // End always goes to the bottom
      if (aType === 'end' && bType !== 'end') return 1;
      if (bType === 'end' && aType !== 'end') return -1;

      // Visually top-down sequence 
      if (Math.abs(a.y - b.y) > 20) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });
  }, [nodes]);

  // Search filtered headings
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return sortedNodes;
    const query = searchQuery.toLowerCase();
    return sortedNodes.filter(node => 
      node.title.toLowerCase().includes(query) || 
      node.script.toLowerCase().includes(query)
    );
  }, [sortedNodes, searchQuery]);

  // Find destination connections for a node
  const getNodeConnections = (nodeId: string) => {
    return connections
      .filter(conn => conn.fromId === nodeId)
      .map(conn => {
        const targetNode = nodes.find(n => n.id === conn.toId);
        return {
          connectionId: conn.id,
          targetId: conn.toId,
          targetTitle: targetNode ? targetNode.title : 'End Node',
          color: conn.color || targetNode?.borderColor || '#5c6f9e'
        };
      });
  };

  // Scroll to node block inside the document view
  const handleScrollToNode = (nodeId: string) => {
    const element = document.getElementById(`doc-node-${nodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add text highlighting flash effect temporarily
      element.classList.add('ring-2', 'ring-cyan-500/40', 'bg-cyan-950/20');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-cyan-500/40', 'bg-cyan-950/20');
      }, 1500);
    }
  };

  // Export as text document
  const handleExportText = () => {
    let docContent = `==================================================\n`;
    docContent += `SCENARIO EXPORT: ${projectName.toUpperCase()}\n`;
    docContent += `Generated on: ${new Date().toLocaleString()}\n`;
    docContent += `==================================================\n\n`;

    sortedNodes.forEach((node, index) => {
      docContent += `[BLOCK #${index + 1}] : ${node.title.toUpperCase()}\n`;
      docContent += `Type: ${getEffectiveType(node).toUpperCase()}\n`;
      docContent += `--------------------------------------------------\n`;
      docContent += `${node.script || '(No narration text written for this block.)'}\n`;
      
      const outgoing = getNodeConnections(node.id);
      if (outgoing.length > 0) {
        docContent += `\nConnected Branches:\n`;
        outgoing.forEach(out => {
          docContent += `  ➔ ${out.targetTitle}\n`;
        });
      }
      docContent += `\n==================================================\n\n`;
    });

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}_scenario_document.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="document-view-panel" className="absolute inset-0 w-full h-full flex flex-col bg-[#06080e] text-slate-200 font-sans overflow-hidden select-text touch-pan-y" style={{ touchAction: 'pan-y' }}>
      
      {/* Click-outside backdrop for sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 pointer-events-auto cursor-pointer"
          />
        )}
      </AnimatePresence>

      {/* Sidebar navigation drawer as ABSOLUTE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ x: -310, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -310, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute top-0 bottom-0 left-0 w-[310px] border-r border-[#19213d] bg-[#090c15]/95 backdrop-blur-md flex flex-col overflow-hidden z-30 shadow-2xl h-full"
          >
            {/* Outline Header */}
            <div className="p-4 border-b border-[#1b2341] flex items-center justify-between bg-[#0b0e1a]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Scenario Outline
                </span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded bg-[#12182c] hover:bg-[#1a2340] text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Hide sidebar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live outline search */}
            <div className="p-3 bg-[#070910] border-b border-[#151c35]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter headings & text..."
                  className="w-full bg-[#0a0d18] border border-[#1b223d] rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Outline Headings list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
              {filteredNodes.length > 0 ? (
                filteredNodes.map((node, idx) => {
                  const itemColor = node.borderColor || '#38bdf8';
                  return (
                    <button
                      key={node.id}
                      onClick={() => {
                        handleScrollToNode(node.id);
                        setIsSidebarOpen(false); // Auto close sidebar on select
                      }}
                      className="w-full flex items-center justify-between text-left p-2.5 rounded-lg hover:bg-[#111729] border border-transparent hover:border-[#212d4d]/30 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Colored bullet reflecting the map color */}
                        <div 
                          className="w-1.5 h-6 rounded-full shrink-0 mt-0.5" 
                          style={{ backgroundColor: itemColor }}
                        />
                        <div className="min-w-0">
                          <p 
                            className="text-xs font-bold leading-tight truncate group-hover:text-white transition-colors font-sans"
                            style={{ color: itemColor }}
                          >
                            {node.title}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5 max-w-[200px]">
                            {node.script || 'No narration content...'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-12 px-4 space-y-2">
                  <span className="text-slate-600 text-[11px] font-mono block">No matching headings</span>
                  <span className="text-[10px] text-slate-500 font-sans block leading-normal">Try searching with a different storyboard plot keyword.</span>
                </div>
              )}
            </div>

            {/* Export block */}
            <div className="p-3 border-t border-[#1b2341] bg-[#0b0e1a] shrink-0">
              <button
                onClick={handleExportText}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-cyan-600/10 hover:bg-cyan-600 border border-cyan-500/20 hover:border-cyan-500 text-cyan-400 hover:text-white font-mono text-xs font-bold rounded-lg transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                Export Raw Document
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main flowable document canvas area */}
      <div className="flex-1 flex flex-col h-full bg-[#030509] relative min-w-0">

        {/* Minimal Document View Header with Floating Controls */}
        <div className="h-14 border-b border-[#131a31]/80 px-4 sm:px-6 flex items-center justify-between bg-[#060910]/80 backdrop-blur-md shrink-0 z-10 select-none">
          <div className="flex items-center gap-3 min-w-0">
            {/* Show/Hide sidebar hamburger */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 bg-[#121626] hover:bg-cyan-500 text-slate-300 hover:text-[#060910] border border-[#232a42] rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                title="Show document outline sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
              <h2 className="text-xs font-mono font-black uppercase tracking-widest text-[#00e5ff] shrink-0">
                DOCUMENT
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {nodes.length} Elements
            </span>
          </div>
        </div>

        {/* Dedicated Full-Width Horizontal Block for Project Name */}
        <div className="bg-[#080b15] border-b border-[#19213d] px-4 py-2.5 flex items-center justify-between shrink-0 select-none z-10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest shrink-0">
              Project Name:
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-100 font-sans tracking-wide truncate">
              {projectName || 'Unnamed Scenario'}
            </span>
          </div>
        </div>

        {/* Pure Elegant Word-Style Document Container */}
        <div 
          ref={documentContainerRef} 
          className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 space-y-1.5 scroll-smooth select-text selection:bg-cyan-500/35 overflow-x-hidden min-h-0 h-full touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {/* Scenario blocks rendered sequentially */}
          <div className="max-w-2xl mx-auto space-y-1.5 pb-24">
            {sortedNodes.map((node, index) => {
              const nodeType = getEffectiveType(node);
              const nodeColor = TYPE_COLORS[nodeType];
              const outgoing = getNodeConnections(node.id);
              
              return (
                <div 
                  key={node.id} 
                  id={`doc-node-${node.id}`}
                  className="group relative bg-[#090b13] border border-[#1b233a]/50 rounded-xl p-4 md:p-5 hover:border-[#212d4d] transition-all duration-300 shadow-[0_2px_15px_rgba(0,0,0,0.25)] scroll-mt-20"
                >
                  {/* Color strip identifier block on left */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl transition-transform" 
                    style={{ backgroundColor: nodeColor }}
                  />                   {/* Block Metadata header and tag style */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 select-none">
                    <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
                      <span className="text-slate-500">SECTION {index + 1}</span>
                      <span className="text-[#1f283d]">•</span>
                      <span className="px-2 py-0.5 rounded uppercase border text-[8px]" style={{ borderColor: `${nodeColor}40`, color: nodeColor, backgroundColor: `${nodeColor}08` }}>
                        {nodeType}
                      </span>
                    </div>
                  </div>

                  {/* Main Headings styled in their node-specific color as requested! */}
                  <h3 
                    className="text-base md:text-lg font-bold font-sans tracking-tight mb-2 transition-colors leading-snug"
                    style={{ color: nodeColor }}
                  >
                    {node.title}
                  </h3>

                  {/* Render attached scene images (Media objects) */}
                  {node.media && node.media.length > 0 && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-[#202947]/70 bg-[#04060b] shadow-inner select-none relative group/media max-h-[220px]">
                      <img 
                        src={node.media[0].dataUrl} 
                        alt={`Scene ${node.title}`}
                        className="w-full object-cover max-h-[220px] hover:scale-101 transition-transform duration-500" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 p-2 flex items-center justify-between text-[10px] font-mono select-none">
                        <span className="text-slate-300 flex items-center gap-1.5 truncate">
                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          {node.media[0].name}
                        </span>
                        <span className="text-slate-500 font-medium">
                          {(node.media[0].size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Narrative Script / Plot detail text: Color text tinted or full node-color based on graph */}
                  <div className="space-y-2">
                    <p 
                      className="text-sm font-normal leading-relaxed font-sans whitespace-pre-wrap transition-colors"
                      style={{ color: `${nodeColor}ee` }} // Apply same color with high opacity for excellent legibility
                    >
                      {node.script || (
                        <span className="text-slate-600 italic font-mono text-xs block">
                          [No narration dialog script written for this scenario block. Write a plot sequence detail inside the main graph canvas to view here.]
                        </span>
                      )}
                    </p>

                    {/* Extended node fields if they exist */}
                    {node.fields && node.fields.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-[#1a233d]/40 space-y-4">
                        {node.fields.map(field => {
                          if (field.type === 'text' && field.textValue) {
                            return (
                              <div key={field.id} className="space-y-1 text-xs">
                                <span className="text-[10px] font-mono uppercase tracking-wider block" style={{ color: `${nodeColor}aa` }}>
                                  {field.name}:
                                </span>
                                <p className="leading-relaxed font-sans font-medium" style={{ color: `${nodeColor}dd` }}>
                                  {field.textValue}
                                </p>
                              </div>
                            );
                          }
                          if (field.type === 'media' && field.mediaValue && field.mediaValue.length > 0) {
                            return (
                              <div key={field.id} className="space-y-2">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                                  {field.name}
                                </span>
                                <div className="grid grid-cols-2 gap-2 max-w-sm">
                                  {field.mediaValue.map(m => (
                                    <div key={m.id} className="rounded-lg overflow-hidden border border-[#202947]/70 bg-black aspect-video relative">
                                      <img 
                                        src={m.dataUrl} 
                                        alt={field.name}
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Transition path nodes display */}
                  {outgoing.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-[#1c243f]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
                      <span className="text-[9px] font-mono text-[#5c6f9e] uppercase font-bold tracking-wider">
                        Linked Branches
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {outgoing.map(out => (
                          <button
                            key={out.connectionId}
                            onClick={() => handleScrollToNode(out.targetId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#101526]/80 hover:bg-[#161d36] hover:text-white border border-[#212c4d] rounded-full transition-all text-[10px] font-mono font-bold cursor-pointer"
                            style={{ color: out.color }}
                          >
                            <span>➔</span>
                            <span>{out.targetTitle}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
