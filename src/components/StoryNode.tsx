import React, { useRef, useState } from 'react';
import { StoryNode, MediaFile } from '../types';
import { Save, Folder, FolderOpen, Image, Film, Plus, FileText, Trash2, CheckCircle, Settings, Check } from 'lucide-react';

interface StoryNodeProps {
  node: StoryNode;
  onUpdate: (id: string, updates: Partial<StoryNode>) => void;
  onOpenDirectory: (node: StoryNode) => void;
  onStartConnection: (nodeId: string, event: React.MouseEvent | React.TouchEvent) => void;
  onDelete: (id: string) => void;
  moveMode?: boolean;
  theme?: 'classic' | 'cosmic';
}

export default function StoryNodeComponent({
  node,
  onUpdate,
  onOpenDirectory,
  onStartConnection,
  onDelete,
  moveMode = false,
  theme = 'classic',
}: StoryNodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localShowSettings, setLocalShowSettings] = useState(false);
  const [showAddFieldMenu, setShowAddFieldMenu] = useState(false);
  const [activeMediaFieldId, setActiveMediaFieldId] = useState<string | null>(null);

  const fields = node.fields && node.fields.length > 0 ? node.fields : [
    { id: 'f-fallback-media', type: 'media' as const, name: 'Media Files', mediaValue: node.media || [] },
    { id: 'f-fallback-text', type: 'text' as const, name: 'Plot Script', textValue: node.script || '' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeMediaFieldId) return;

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

      const updatedFields = fields.map((f) => {
        if (f.id === activeMediaFieldId) {
          return {
            ...f,
            mediaValue: [...(f.mediaValue || []), newMedia],
          };
        }
        return f;
      });

      onUpdate(node.id, {
        fields: updatedFields,
        media: updatedFields.find(f => f.type === 'media')?.mediaValue || [],
        isSaved: false,
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddField = (type: 'text' | 'media') => {
    const newField = {
      id: `field_${Math.random().toString(36).substring(2, 7)}`,
      type,
      name: type === 'text' ? 'Text Section' : 'Media Section',
      textValue: type === 'text' ? '' : undefined,
      mediaValue: type === 'media' ? [] : undefined,
    };
    const updatedFields = [...fields, newField];
    onUpdate(node.id, {
      fields: updatedFields,
      isSaved: false,
    });
    setShowAddFieldMenu(false);
  };

  const handleRemoveField = (fieldId: string) => {
    const updatedFields = fields.filter((f) => f.id !== fieldId);
    onUpdate(node.id, {
      fields: updatedFields,
      script: updatedFields.find(f => f.type === 'text')?.textValue || '',
      media: updatedFields.find(f => f.type === 'media')?.mediaValue || [],
      isSaved: false,
    });
  };

  const currentFrameColor = node.borderColor || node.lineColor || '#10b981';
  const currentFrameThickness = node.borderThickness !== undefined ? node.borderThickness : 2;

  return (
    <div
      id={`story-node-card-${node.id}`}
      className="w-72 bg-[#10131e]/95 backdrop-blur-md rounded-xl transition-all select-none shadow-2xl flex flex-col relative"
      style={{
        borderColor: currentFrameColor,
        borderWidth: `${currentFrameThickness}px`,
        borderStyle: 'solid',
        boxShadow: `0 10px 30px -15px ${currentFrameColor}50`
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

      <div className="px-4 py-2 bg-[#151928] border-b border-[#21273d] flex items-center justify-between rounded-t-xl cursor-grab active:cursor-grabbing nodrag relative z-10">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span 
            className="w-1.5 h-1.5 rounded-full shrink-0 font-sans" 
            style={{ backgroundColor: node.lineColor || '#10b981' }}
          />
          
          <input
            type="text"
            id={`title-input-${node.id}`}
            value={node.title}
            onChange={(e) => onUpdate(node.id, { title: e.target.value, isSaved: false })}
            className="text-xs font-semibold text-slate-200 bg-transparent border border-transparent hover:border-slate-800 focus:border-slate-700 focus:bg-[#0c0e18] rounded px-1.5 py-0.5 focus:outline-none w-full max-w-[190px] truncate transition-colors font-sans"
            placeholder="Cell Description..."
          />
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
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

      {localShowSettings && (
        <div className="bg-[#141828] border-b border-[#21273d] p-3 space-y-3.5 nodrag select-none animate-fade-in relative z-20 font-sans">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1 mb-1">
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-widest font-mono">Block & Line Settings</span>
            <span className="text-[8px] text-slate-500 font-mono">This Block Only</span>
          </div>

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
                  className="w-5 h-5 rounded-full border border-white/5 relative flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all"
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
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block font-mono">Outgoing lines Color:</span>
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
                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>

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
              <span>Outgoing Line Thickness:</span>
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
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block font-mono font-bold">Line Style Style:</span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(node.id, { lineDashed: false, isSaved: false });
                }}
                className={`py-1 px-1.5 rounded font-mono text-[9px] font-semibold border text-center cursor-pointer transition-all ${
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
                className={`py-1 px-1.5 rounded font-mono text-[9px] font-semibold border text-center cursor-pointer transition-all ${
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

      <div className="p-4 space-y-4 flex-1 select-text relative z-10 overflow-y-auto max-h-[380px] custom-scrollbar">
        {fields.map((field) => (
          <div 
            key={field.id} 
            className="space-y-1.5 pt-3 border-t border-[#1d2336]/60 first:border-0 first:pt-0"
          >
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={field.name}
                onChange={(e) => {
                  const updatedFields = fields.map((f) => {
                    if (f.id === field.id) return { ...f, name: e.target.value };
                    return f;
                  });
                  onUpdate(node.id, { fields: updatedFields, isSaved: false });
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-transparent border border-transparent hover:border-slate-850 hover:bg-[#08090f]/50 focus:border-slate-800 focus:bg-[#07080d] rounded px-1.5 py-0.5 focus:outline-none w-full max-w-[145px] font-sans transition-all cursor-pointer"
                placeholder="Section Label..."
              />

              <div className="flex items-center gap-1.5 shrink-0 select-none">
                {field.type === 'media' && (
                  <button
                    onClick={() => {
                      setActiveMediaFieldId(field.id);
                      setTimeout(() => fileInputRef.current?.click(), 20);
                    }}
                    className="flex items-center gap-0.5 text-[9px] font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" /> Attach
                  </button>
                )}

                {fields.length > 1 && (
                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800/4.0 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {field.type === 'text' ? (
              <textarea
                value={field.textValue || ''}
                onChange={(e) => {
                  const updatedFields = fields.map((f) => {
                    if (f.id === field.id) return { ...f, textValue: e.target.value };
                    return f;
                  });
                  onUpdate(node.id, {
                    fields: updatedFields,
                    script: updatedFields.find(f => f.type === 'text')?.textValue || '',
                    isSaved: false,
                  });
                }}
                placeholder="Plot script..."
                className="w-full h-20 bg-[#080a10] border border-[#1d2336] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 font-mono resize-none leading-relaxed placeholder:text-slate-600"
              />
            ) : (
              <div className="nodrag">
                {(!field.mediaValue || field.mediaValue.length === 0) ? (
                  <div className="border border-dashed border-[#1d2336] bg-[#090b10] rounded-lg p-2.5 text-center">
                    <span className="text-[10px] text-slate-600 font-mono">No files attached</span>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {field.mediaValue.map((file) => (
                      <div 
                        key={file.id} 
                        className="bg-[#0c0e16] border border-[#1d2336] rounded-md p-1 flex items-center justify-between text-xs gap-2"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className={`w-5 h-5 rounded bg-[#131622] border flex items-center justify-center shrink-0 transition-all ${
                            theme === 'cosmic' ? 'border-cyan-500/30' : 'border-orange-500/20'
                          }`}>
                            <Folder className={`w-3 h-3 transition-colors ${
                              theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
                            }`} />
                          </div>
                          <span className="font-mono text-[9px] text-slate-300 truncate max-w-[120px]">{file.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            const updatedFields = fields.map((f) => {
                              if (f.id === field.id) {
                                return {
                                  ...f,
                                  mediaValue: (f.mediaValue || []).filter((m) => m.id !== file.id),
                                };
                              }
                              return f;
                            });
                            onUpdate(node.id, {
                              fields: updatedFields,
                              media: updatedFields.find(f => f.type === 'media')?.mediaValue || [],
                              isSaved: false,
                            });
                          }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-850 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,video/*"
        />

        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#1d2336] relative">
          
          <div className="relative">
            <button
              id={`btn-add-field-menu-${node.id}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowAddFieldMenu(!showAddFieldMenu);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600/10 hover:bg-blue-600/25 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-mono font-semibold cursor-pointer transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              Add
            </button>

            {showAddFieldMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30 pointer-events-auto" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddFieldMenu(false);
                  }} 
                />
                
                <div className="absolute bottom-full left-0 mb-1.5 w-[140px] bg-[#121523] border border-slate-800 rounded-lg shadow-2xl p-1 z-40 animate-fade-in font-sans space-y-0.5" style={{ minWidth: '140px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddField('text');
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-[#1e233b] text-slate-200 hover:text-white rounded text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    + Text Field
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddField('media');
                    }}
                    className="w-full text-left px-2 py-1.5 hover:bg-[#1e233b] text-slate-200 hover:text-white rounded text-[11px] font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Image className="w-3.5 h-3.5 text-emerald-400" />
                    + Media Section
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            id={`btn-open-dir-${node.id}`}
            onClick={() => onOpenDirectory(node)}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#121521] hover:bg-[#1d2238] text-slate-300 border rounded-lg text-xs font-mono font-semibold cursor-pointer transition-colors ${
              theme === 'cosmic' ? 'border-cyan-500/20 hover:border-cyan-500/50' : 'border-orange-500/20 hover:border-orange-500/50'
            }`}
          >
            <Folder className={`w-3.5 h-3.5 transition-colors ${
              theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
            }`} />
            Open Dir
          </button>
        </div>
      </div>

      <div 
        id={`input-socket-${node.id}`}
        className="absolute left-0 top-[135px] -translate-x-1/2 -translate-y-1/2 w-[16px] h-[16px] rounded-full bg-[#1c2237] border-2 shadow-lg flex items-center justify-center group z-30 pointer-events-auto"
        style={{
          borderColor: node.lineColor || '#10b981',
        }}
      >
        <div 
          className="w-[6px] h-[6px] rounded-full" 
          style={{
            backgroundColor: node.lineColor || '#34d399',
          }}
        />
      </div>

      <div 
        id={`output-socket-${node.id}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnection(node.id, e);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          onStartConnection(node.id, e);
        }}
        className="absolute right-0 top-[135px] translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-[#1c2237] border-2 shadow-xl cursor-crosshair flex items-center justify-center group hover:scale-125 transition-all duration-100 z-30 pointer-events-auto"
        style={{
          borderColor: node.lineColor || '#10b981',
        }}
      >
        <div 
          className="w-[8px] h-[8px] rounded-full group-hover:scale-110 transition-transform" 
          style={{
            backgroundColor: node.lineColor || '#34d399',
          }}
        />
      </div>
    </div>
  );
}
