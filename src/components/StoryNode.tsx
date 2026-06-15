import React, { useRef, useState } from 'react';
import { StoryNode, MediaFile, ChoiceVariation, Connection } from '../types';
import { Image, Plus, Trash2, Settings, Check, CheckCheck } from 'lucide-react';

interface StoryNodeProps {
  node: StoryNode;
  onUpdate: (id: string, updates: Partial<StoryNode>) => void;
  onOpenDirectory: (node: StoryNode) => void;
  onStartConnection: (nodeId: string, choiceId: string | null, event: React.MouseEvent | React.TouchEvent) => void;
  onDelete: (id: string) => void;
  onAddChoice?: (nodeId: string, choiceId: string, text: string, index: number) => void;
  moveMode?: boolean;
  theme?: 'classic' | 'cosmic';
  onInspectNode?: (nodeId: string) => void;
  isSingle?: boolean;
  nodes?: StoryNode[];
  connections?: Connection[];
}

// Predictable height calculator for the card, ensuring connections map to the exact pixel!
export function getNodeHeight(node: StoryNode): number {
  const hasImage = node.media && node.media.length > 0;
  const imageSectionHeight = hasImage ? 110 : 70;
  // Preceding heights: 
  // Header: 42px
  // Type block toggle: 34px
  // padding-top: 12px
  // imageSectionHeight
  // spacing: 12px (mt-3 before Dialogue)
  // Dialogue: h-[112px]
  // spacing: 12px (mt-3 before Variations)
  // Variations label: h-6 (24px)
  const precedingHeight = 42 + 34 + 12 + imageSectionHeight + 12 + 112 + 12 + 24; 
  
  const variationsCount = node.variations?.length || 0;
  
  // List container: each row is 36px plus 6px gap = 42px.
  // Last row has no bottom gap in the list itself, but there is gap-[6px] between list and input row.
  // So variations list + input is:
  const variationsContainerHeight = variationsCount > 0 
    ? (variationsCount * 42) + 36 
    : 36;
  
  const bottomPadding = 12;
  const borderAdjust = (node.borderThickness !== undefined ? node.borderThickness : 2) * 2;
  
  return precedingHeight + variationsContainerHeight + bottomPadding + borderAdjust;
}

export default function StoryNodeComponent({
  node,
  onUpdate,
  onOpenDirectory,
  onStartConnection,
  onDelete,
  onAddChoice,
  moveMode = false,
  theme = 'classic',
  onInspectNode,
  isSingle = false,
  nodes = [],
  connections = [],
}: StoryNodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localShowSettings, setLocalShowSettings] = useState(false);
  const [showInspectModal, setShowInspectModal] = useState(false);
  const [showTypePanel, setShowTypePanel] = useState(false);
  const [newChoiceText, setNewChoiceText] = useState('');

  const TYPE_COLORS: Record<string, string> = {
    start: '#10b981',       // Green
    end: '#ef4444',         // Red
    variation: '#f97316',    // Orange
    description: '#3b82f6', // Blue
  };

  const NODE_TYPES = [
    { value: 'start' as const, label: 'Start', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20', icon: '🟢' },
    { value: 'end' as const, label: 'End', color: 'text-red-400 border-red-500/30 bg-red-950/20', icon: '🔴' },
    { value: 'variation' as const, label: 'Variation', color: 'text-orange-400 border-orange-500/30 bg-orange-950/20', icon: '🟠' },
    { value: 'description' as const, label: 'Description', color: 'text-blue-400 border-blue-500/30 bg-blue-950/20', icon: '🔵' },
  ];

  const getChoiceSocketColor = (choiceId: string, defaultColor: string): string => {
    // Check if there is an active connection from this choice socket
    const conn = connections.find(c => c.fromId === node.id && c.fromChoiceId === choiceId);
    if (conn) {
      const toNode = nodes.find(n => n.id === conn.toId);
      if (toNode) {
        const toType = toNode.nodeType || 'description';
        return TYPE_COLORS[toType] || '#f97316';
      }
    }

    // Default: color of the current element's type
    const fromType = node.nodeType || 'description';
    return TYPE_COLORS[fromType] || '#f97316';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const newMedia: MediaFile = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
        size: file.size,
      };

      onUpdate(node.id, {
        media: [newMedia], // replace with exactly one background image
        isSaved: false,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddChoice = () => {
    if (!newChoiceText.trim()) return;
    const choiceId = `choice_${Math.random().toString(36).substring(2, 7)}`;
    const text = newChoiceText.trim();

    const updated = [...(node.variations || []), { id: choiceId, text }];
    onUpdate(node.id, {
      variations: updated,
      isSaved: false,
    });

    if (onAddChoice) {
      onAddChoice(node.id, choiceId, text, updated.length - 1);
    }
    setNewChoiceText('');
  };

  const nodeType = node.nodeType || 'description';
  const isStrictType = nodeType !== 'description';
  const currentFrameColor = isSingle ? '#10b981' : (isStrictType ? TYPE_COLORS[nodeType] : (node.borderColor || TYPE_COLORS[nodeType] || node.lineColor || '#10b981'));
  const currentLineColor = isStrictType ? TYPE_COLORS[nodeType] : (node.lineColor || currentFrameColor);
  const currentFrameThickness = node.borderThickness !== undefined ? node.borderThickness : 2;
  const hasImage = node.media && node.media.length > 0;
  const cardHeight = getNodeHeight(node);

  const getDefaultOutputSocketColor = () => {
    const fromType = node.nodeType || 'description';
    if (fromType === 'start') {
      return '#10b981';
    }

    // Check if there is an active connection from this main output socket
    const mainConn = connections.find(c => c.fromId === node.id && !c.fromChoiceId);
    if (mainConn) {
      const toNode = nodes.find(n => n.id === mainConn.toId);
      if (toNode) {
        const toType = toNode.nodeType || 'description';
        return TYPE_COLORS[toType] || '#3b82f6';
      }
    }

    // Default: color of the current element's type
    return TYPE_COLORS[fromType] || '#3b82f6';
  };

  const getInputSocketColor = () => {
    const tType = node.nodeType || 'description';
    if (tType === 'start') return '#10b981';
    if (tType === 'variation') return '#f97316';
    if (tType === 'end') return '#ef4444';
    if (tType === 'description') {
      return node.lineColor || currentFrameColor || '#3b82f6';
    }
    return '#3b82f6';
  };

  return (
    <div
      id={`story-node-card-${node.id}`}
      className="w-72 bg-[#10131e]/95 backdrop-blur-md rounded-xl transition-all select-none shadow-2xl flex flex-col relative"
      style={{
        borderColor: currentFrameColor,
        borderWidth: `${currentFrameThickness}px`,
        borderStyle: 'solid',
        boxShadow: `0 10px 30px -15px ${currentFrameColor}50`,
        height: `${cardHeight}px`
      }}
    >
      {moveMode && (
        <div 
          className="absolute inset-0 bg-blue-500/5 rounded-xl border border-dashed border-blue-500/20 cursor-move z-20 flex items-center justify-center backdrop-blur-[0.5px]"
        >
          <div className="bg-[#0b0c13]/90 border border-blue-500/40 px-2 py-1 rounded text-[10px] font-mono font-bold text-blue-400 shadow-md">
            MOVE MODE ON
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-3 h-[42px] bg-[#151928] border-b border-[#21273d] flex items-center justify-between rounded-t-xl cursor-grab active:cursor-grabbing nodrag relative z-10">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 relative animate-fade-in">
          <span 
            className="w-1.5 h-1.5 rounded-full shrink-0" 
            style={{ backgroundColor: currentLineColor }}
          />
          <input
            type="text"
            id={`title-input-${node.id}`}
            value={node.title}
            onChange={(e) => onUpdate(node.id, { title: e.target.value, isSaved: false })}
            className="text-xs font-semibold text-slate-200 bg-transparent border border-transparent hover:border-slate-800 focus:border-slate-700 focus:bg-[#0c0e18] rounded px-1 px-1.5 py-0.5 focus:outline-none w-full max-w-[190px] truncate transition-all font-sans"
            placeholder="Cell Description..."
          />
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <button
            id={`btn-node-inspect-${node.id}`}
            title="Inspect Details"
            onClick={(e) => {
              e.stopPropagation();
              if (onInspectNode) {
                onInspectNode(node.id);
              } else {
                setShowInspectModal(true);
              }
            }}
            className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
          </button>

          <button
            id={`btn-node-settings-${node.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setLocalShowSettings(!localShowSettings);
            }}
            className={`p-1 rounded transition-colors cursor-pointer shrink-0 ${
              localShowSettings
                ? 'text-blue-400 bg-blue-500/10'
                : 'text-slate-500 hover:text-blue-400 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            id={`btn-delete-${node.id}`}
            onClick={() => onDelete(node.id)}
            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dynamic Type Block Header */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setShowTypePanel(!showTypePanel);
        }}
        className="px-3 h-[34px] bg-[#121522] border-b border-[#1d243a] hover:bg-[#1a2033]/90 transition-all flex items-center justify-between text-xs cursor-pointer select-none nodrag group relative z-10"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest font-bold">Type:</span>
          <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-black border tracking-wider transition-all flex items-center gap-1.5 ${
            NODE_TYPES.find(t => t.value === (node.nodeType || 'description'))?.color
          }`}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[node.nodeType || 'description'] }} />
            <span>{NODE_TYPES.find(t => t.value === (node.nodeType || 'description'))?.label}</span>
          </span>
        </div>
        <span className="text-[10px] text-blue-400 font-mono font-bold group-hover:underline flex items-center gap-1 shrink-0">
          Settings {showTypePanel ? '▲' : '▼'}
        </span>
      </div>

      {showTypePanel && (
        <div className="bg-[#141829] border-b border-[#21273d] p-3 space-y-2.5 nodrag select-none animate-fade-in absolute top-[76px] left-0 w-full z-20 font-sans shadow-xl">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Block Type:</p>
          <div className="flex flex-col gap-1.5">
            {NODE_TYPES.map((t) => {
              const isActive = (node.nodeType || 'description') === t.value;
              return (
                <button
                  key={t.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    const selectedColor = TYPE_COLORS[t.value];
                    onUpdate(node.id, { 
                      nodeType: t.value, 
                      borderColor: selectedColor, 
                      lineColor: selectedColor, 
                      isSaved: false 
                    });
                    setShowTypePanel(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-[#1f253d] rounded-lg text-xs font-semibold flex items-center justify-between transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-[#181e33]/80 border-blue-500/45 text-white' 
                      : 'bg-[#0d101a] border-slate-800/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[t.value] }} />
                    <span className="font-mono uppercase tracking-wider text-[11px] font-bold" style={{ color: TYPE_COLORS[t.value] }}>
                      {t.label}
                    </span>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {localShowSettings && (
        <div className="bg-[#141828] border-b border-[#21273d] p-3 space-y-3 nodrag select-none animate-fade-in absolute top-[76px] left-0 w-full z-20 font-sans shadow-xl max-h-[300px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono">Line Settings</span>
            <span className="text-[8px] text-slate-500 font-mono">This Block</span>
          </div>

          {nodeType === 'description' && (
            <>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block font-mono">Frame Border Color:</span>
                <div className="grid grid-cols-7 gap-1">
                  {[
                    { hex: '#10b981', label: 'Green' },
                    { hex: '#ea580c', label: 'Orange' },
                    { hex: '#8b5cf6', label: 'Purple' },
                    { hex: '#0284c7', label: 'Blue' },
                    { hex: '#d97706', label: 'Yellow' },
                    { hex: '#dc2626', label: 'Red' },
                    { hex: '#475569', label: 'Slate' },
                  ].map((col) => (
                    <button
                      key={col.hex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(node.id, { borderColor: col.hex, isSaved: false });
                      }}
                      className="w-5 h-5 rounded-full border border-white/5 relative flex items-center justify-center cursor-pointer hover:scale-110 transition-all"
                      style={{ backgroundColor: col.hex }}
                      title={col.label}
                    >
                      {currentFrameColor === col.hex && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block font-mono">Outlet Lines Color:</span>
                <div className="grid grid-cols-7 gap-1">
                  {[
                    { hex: '#10b981', label: 'Green' },
                    { hex: '#ea580c', label: 'Orange' },
                    { hex: '#8b5cf6', label: 'Purple' },
                    { hex: '#0284c7', label: 'Blue' },
                    { hex: '#d97706', label: 'Yellow' },
                    { hex: '#dc2626', label: 'Red' },
                    { hex: '#64748b', label: 'Slate' },
                  ].map((col) => (
                    <button
                      key={col.hex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate(node.id, { lineColor: col.hex, isSaved: false });
                      }}
                      className="w-5 h-5 rounded-full border border-white/5 relative flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all"
                      style={{ backgroundColor: col.hex }}
                      title={col.label}
                    >
                      {(node.lineColor || '#10b981') === col.hex && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-md animate-fade-in" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase font-mono">
              <span>Frame Border Thickness:</span>
              <span className="text-blue-400 font-mono text-[10px]">{node.borderThickness !== undefined ? node.borderThickness : 2}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={node.borderThickness !== undefined ? node.borderThickness : 2}
              onChange={(e) => {
                e.stopPropagation();
                onUpdate(node.id, { borderThickness: parseInt(e.target.value), isSaved: false });
              }}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase font-mono">
              <span>Line Thickness:</span>
              <span className="text-blue-400 font-mono text-[10px]">{node.lineThickness !== undefined ? node.lineThickness : 2.5}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={node.lineThickness !== undefined ? node.lineThickness : 2.5}
              onChange={(e) => {
                e.stopPropagation();
                onUpdate(node.id, { lineThickness: parseFloat(e.target.value), isSaved: false });
              }}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono font-bold">Line Style:</span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(node.id, { lineDashed: false, isSaved: false });
                }}
                className={`py-1 px-1.5 rounded font-mono text-[9px] border text-center cursor-pointer transition-all ${
                  !node.lineDashed
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-[#0d0f17] text-slate-400 border-slate-800'
                }`}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(node.id, { lineDashed: true, isSaved: false });
                }}
                className={`py-1 px-1.5 rounded font-mono text-[9px] border text-center cursor-pointer transition-all ${
                  node.lineDashed
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                    : 'bg-[#0d0f17] text-slate-400 border-slate-800'
                }`}
              >
                Dashed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Content Container */}
      <div className="p-3 flex flex-col flex-1 relative" style={{ height: `${cardHeight - 42 - 34 - (currentFrameThickness * 2)}px` }}>
        
        {/* IMAGE SECTION */}
        {hasImage ? (
          <div className="h-[110px] w-full relative rounded-lg overflow-hidden group/img shrink-0 border border-slate-800 bg-slate-950/40">
            <img 
              src={node.media[0].dataUrl} 
              alt="Story Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-[#090b14] rounded text-[10px] font-mono font-bold cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onUpdate(node.id, { media: [], isSaved: false })}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-mono cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-[70px] w-full border border-dashed border-[#232c49] hover:border-cyan-500/50 bg-[#090b10] hover:bg-[#121626] rounded-lg flex flex-col items-center justify-center text-slate-500 hover:text-cyan-400 transition-all shrink-0 cursor-pointer"
          >
            <Image className="w-4.5 h-4.5 mb-1.5" />
            <span className="text-[9px] font-sans font-black uppercase tracking-wider">Set Background Image</span>
          </button>
        )}

        {/* DIALOGUE STORY TEXT SECTION */}
        <div className="mt-3 flex flex-col shrink-0 h-[112px]">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5c6f9e] h-5 flex items-center">
            Dialogue / Story Script:
          </span>
          <textarea
            value={node.script}
            onChange={(e) => onUpdate(node.id, { script: e.target.value, isSaved: false })}
            placeholder="Write scene description or dialogue speech..."
            className="w-full h-[80px] mt-1 bg-[#080a10] border border-[#1d2336] rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/60 font-sans resize-none leading-relaxed placeholder:text-slate-650"
          />
        </div>

        {/* VARIATIONS / CHOICES SECTION */}
        <div className="mt-3 flex flex-col flex-1">
          <span className="text-[10px] font-mono font-bold uppercase text-[#5c6f9e] h-6 flex items-center shrink-0">
            Variations & Choice Routes:
          </span>
          
          <div className="flex flex-col gap-[6px] flex-1">
            {/* List of choice rows */}
            <div className="space-y-[6px]">
              {(node.variations || []).map((choice, idx) => {
                const borderCol = node.borderColor || '#10b981';
                return (
                  <div 
                    key={choice.id} 
                    className="h-9 flex items-center justify-between bg-[#121627] hover:bg-[#171d33] border border-[#202844] rounded-lg px-2.5 relative group/row transition-all shrink-0"
                  >
                    <span className="text-xs font-semibold text-slate-200 max-w-[190px] truncate">{choice.text}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = (node.variations || []).filter(v => v.id !== choice.id);
                        onUpdate(node.id, { variations: updated, isSaved: false });
                      }}
                      className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer shrink-0"
                      title="Delete Choice Option"
                    >
                      ✕
                    </button>

                    {/* Choice connection starting socket */}
                    <div 
                      id={`choice-socket-${node.id}-${choice.id}`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onStartConnection(node.id, choice.id, e);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        onStartConnection(node.id, choice.id, e);
                      }}
                      className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#151928] border-2 shadow-md cursor-crosshair flex items-center justify-center hover:scale-125 transition-all z-20"
                      style={{ borderColor: getChoiceSocketColor(choice.id, node.lineColor || borderCol) }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getChoiceSocketColor(choice.id, node.lineColor || borderCol) }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input row */}
            <div className="h-9 flex items-center gap-1.5 mt-auto shrink-0">
              <input
                type="text"
                value={newChoiceText}
                onChange={(e) => setNewChoiceText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChoice();
                  }
                }}
                placeholder="branch option (e.g. Yes)..."
                className="flex-1 h-full text-xs px-2.5 bg-[#090b10] border border-[#1d2336] focus:border-cyan-500 rounded-lg text-slate-100 focus:outline-none font-sans"
              />
              <button
                type="button"
                onClick={handleAddChoice}
                className="w-9 h-full bg-cyan-600/10 hover:bg-cyan-500 text-cyan-400 hover:text-[#090b14] border border-cyan-500/20 rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
                title="Add option and spawn story block"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Always show main output socket on non-end nodes */}
      {node.nodeType !== 'end' && (
        <div 
          id={`output-socket-${node.id}`}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartConnection(node.id, null, e);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            onStartConnection(node.id, null, e);
          }}
          className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-[#1c2237] border-2 shadow-xl cursor-crosshair flex items-center justify-center group hover:scale-125 transition-all duration-100 z-30 pointer-events-auto"
          style={{
            borderColor: getDefaultOutputSocketColor(),
          }}
        >
          <div 
            className="w-[8px] h-[8px] rounded-full group-hover:scale-110 transition-transform" 
            style={{
              backgroundColor: getDefaultOutputSocketColor(),
            }}
          />
        </div>
      )}

      {/* Left Input socket (Always in middle of card) */}
      <div 
        id={`input-socket-${node.id}`}
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full bg-[#1c2237] border-2 shadow-lg flex items-center justify-center group z-30 pointer-events-auto"
        style={{
          borderColor: getInputSocketColor(),
        }}
      >
        <div 
          className="w-[6px] h-[6px] rounded-full" 
          style={{
            backgroundColor: getInputSocketColor(),
          }}
        />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/*"
      />

      {/* Inspect Modal */}
      {showInspectModal && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 bg-[#06070c]/95 backdrop-blur-md z-[99999] flex items-center justify-center p-4 md:p-8 nodrag cursor-default font-sans select-text"
        >
          <div 
            className="w-full max-w-2xl bg-[#0d101a] border border-[#1e2439] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
            style={{
              borderColor: currentFrameColor,
              boxShadow: `0 20px 50px -15px ${currentFrameColor}30`
            }}
          >
            <div className="px-6 py-4 bg-[#141829] border-b border-[#21273d] flex items-center justify-between shrink-0 select-none">
              <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                Story Scene Inspector
              </span>
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="w-8 h-8 rounded-full bg-[#1b2135] hover:bg-red-500 hover:text-white transition-colors text-sm flex items-center justify-center text-slate-400 cursor-pointer font-bold select-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {hasImage && (
                <div className="w-full bg-[#090b12] border border-[#21273c] rounded-xl p-3 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-slate-450 uppercase mb-2">Background Scene Image</span>
                  <img 
                    src={node.media[0].dataUrl} 
                    alt="Background Illustration" 
                    className="max-h-[300px] w-full rounded-lg object-contain shadow-md"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Scene Label / Title</span>
                <input
                  type="text"
                  value={node.title}
                  onChange={(e) => onUpdate(node.id, { title: e.target.value, isSaved: false })}
                  className="w-full text-lg font-bold text-slate-100 bg-[#07090f] border border-[#21273c] rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-500 font-sans"
                  placeholder="Scene title..."
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Dialogue & Narrative Text</span>
                <textarea
                  value={node.script}
                  onChange={(e) => onUpdate(node.id, { script: e.target.value, isSaved: false })}
                  className="w-full h-40 bg-slate-950/80 border border-[#1b2034] rounded-lg p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-500"
                  placeholder="Write story content, character dialogue, or scene description..."
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Choice Variations ({node.variations?.length || 0})</span>
                <div className="space-y-1.5">
                  {(node.variations || []).map((ch) => (
                    <div key={ch.id} className="flex items-center justify-between bg-[#131622] rounded-xl p-3 border border-slate-800">
                      <span className="text-xs text-slate-200 font-semibold">{ch.text}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (node.variations || []).filter(v => v.id !== ch.id);
                          onUpdate(node.id, { variations: updated, isSaved: false });
                        }}
                        className="text-red-400 hover:text-red-300 text-xs font-mono font-bold cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#090b12] border-t border-[#1d2338] flex justify-end shrink-0 select-none">
              <button
                type="button"
                onClick={() => setShowInspectModal(false)}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-[#090b14] font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
