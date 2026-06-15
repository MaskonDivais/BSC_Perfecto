import React, { useRef, useEffect } from 'react';
import { StoryNode, MediaFile, NodeField } from '../types';
import { 
  Image, 
  Trash2, 
  Plus, 
  FileText
} from 'lucide-react';

interface BroadCellInspectorProps {
  node: StoryNode;
  onUpdateNode: (updates: Partial<StoryNode>) => void;
  onBack: () => void;
  theme?: 'classic' | 'cosmic';
}

export default function BroadCellInspector({
  node,
  onUpdateNode,
  onBack,
  theme = 'cosmic',
}: BroadCellInspectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMediaFieldId, setActiveMediaFieldId] = React.useState<string | null>(null);

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

      onUpdateNode({
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
      name: type === 'text' ? 'Script Text' : 'Media Group',
      textValue: type === 'text' ? '' : undefined,
      mediaValue: type === 'media' ? [] : undefined,
    };
    const updatedFields = [...fields, newField];
    onUpdateNode({
      fields: updatedFields,
      isSaved: false,
    });
  };

  const handleRemoveField = (fieldId: string) => {
    const updatedFields = fields.filter((f) => f.id !== fieldId);
    onUpdateNode({
      fields: updatedFields,
      script: updatedFields.find(f => f.type === 'text')?.textValue || '',
      media: updatedFields.find(f => f.type === 'media')?.mediaValue || [],
      isSaved: false,
    });
  };

  // Automatically grow all textareas on content render or window size change
  useEffect(() => {
    const adjustAllHeights = () => {
      const textAreas = document.querySelectorAll('textarea.auto-grow-inspector');
      textAreas.forEach((el) => {
        const ta = el as HTMLTextAreaElement;
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      });
    };
    
    // Tiny delay to ensure layout rendering is completed
    const timer = setTimeout(adjustAllHeights, 50);
    window.addEventListener('resize', adjustAllHeights);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', adjustAllHeights);
    };
  }, [node]);

  const mediaFields = fields.filter(f => f.type === 'media');
  const allMediaFiles = mediaFields.reduce<MediaFile[]>((acc, f) => {
    return [...acc, ...(f.mediaValue || [])];
  }, []);

  const textFields = fields.filter(f => f.type === 'text');

  return (
    <div className="w-full h-full flex flex-col bg-[#04060b] overflow-hidden">
      
      {/* 1. Header with Name & single '✕' close button only */}
      <header className="px-6 md:px-12 py-5 bg-[#070911]/80 border-b border-[#151b2f] flex items-center justify-between shrink-0 select-none backdrop-blur-md">
        <div className="flex-1 mr-4">
          <input
            type="text"
            value={node.title}
            onChange={(e) => onUpdateNode({ title: e.target.value, isSaved: false })}
            className="w-full text-base sm:text-lg font-bold text-slate-100 bg-transparent border-b border-transparent focus:border-cyan-500/50 focus:outline-none transition-colors py-0.5"
            placeholder="Cell Title..."
          />
        </div>

        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-[#111527] hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center font-bold text-sm cursor-pointer active:scale-95"
          title="Close and Return"
        >
          ✕
        </button>
      </header>

      {/* Main scrolling layout */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 select-text bg-[#030408] custom-scrollbar scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          
          {/* Sequence 1: Name / Title Section is already on Header, but let's expose it in full width explicitly as requested "sequence: Name, then Media, then Text" */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block select-none">
              Name
            </span>
            <input
              type="text"
              value={node.title}
              onChange={(e) => onUpdateNode({ title: e.target.value, isSaved: false })}
              className="w-full text-2xl font-extrabold text-white bg-slate-950/80 border border-[#171e33] focus:border-cyan-500 rounded-xl px-5 py-3 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 tracking-tight transition-all"
              placeholder="Name..."
            />
          </div>

          {/* Sequence 2: Media elements (If there are none, then there are none) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block select-none">
                Media Elements
              </span>
              
              <button
                type="button"
                onClick={() => {
                  const firstMediaField = fields.find(f => f.type === 'media');
                  if (firstMediaField) {
                    setActiveMediaFieldId(firstMediaField.id);
                    setTimeout(() => fileInputRef.current?.click(), 10);
                  } else {
                    handleAddField('media');
                    setTimeout(() => {
                      const updatedFields = node.fields || [];
                      const created = updatedFields.find(f => f.type === 'media');
                      if (created) {
                        setActiveMediaFieldId(created.id);
                        setTimeout(() => fileInputRef.current?.click(), 10);
                      }
                    }, 50);
                  }
                }}
                className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer select-none"
              >
                <Plus className="w-3 h-3" /> Add Media
              </button>
            </div>

            {allMediaFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {allMediaFiles.map((m) => {
                  const isVideo = m.type?.startsWith('video/');
                  return (
                    <div 
                      key={m.id} 
                      className="bg-[#080a11] border border-[#151b2e] rounded-xl p-3 flex flex-col space-y-2.5 relative overflow-hidden group"
                    >
                      <div className="flex items-center justify-between select-none">
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-[220px]">{m.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedFields = fields.map((f) => {
                              if (f.type === 'media') {
                                return {
                                  ...f,
                                  mediaValue: (f.mediaValue || []).filter((file) => file.id !== m.id),
                                };
                              }
                              return f;
                            });
                            onUpdateNode({
                              fields: updatedFields,
                              media: updatedFields.find(f => f.type === 'media')?.mediaValue || [],
                              isSaved: false,
                            });
                          }}
                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 flex items-center justify-center bg-black/50 rounded-lg p-2 min-h-[200px] border border-slate-900">
                        {isVideo ? (
                          <video 
                            src={m.dataUrl} 
                            controls 
                            className="max-h-72 w-full rounded-md object-contain" 
                          />
                        ) : (
                          <img 
                            src={m.dataUrl} 
                            alt={m.name} 
                            referrerPolicy="no-referrer"
                            className="max-h-72 w-full rounded-md object-contain" 
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sequence 3: Text elements (If there are none, then there are none) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block select-none">
                Text Elements
              </span>
              
              <button
                type="button"
                onClick={() => handleAddField('text')}
                className="flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer select-none"
              >
                <Plus className="w-3 h-3" /> Add Text
              </button>
            </div>

            {textFields.length > 0 && (
              <div className="space-y-4">
                {textFields.map((f) => {
                  return (
                    <div 
                      key={f.id} 
                      className="bg-[#080a11] border border-[#141b2e] rounded-xl p-4 space-y-3 relative w-full"
                    >
                      <div className="flex justify-between items-center bg-slate-950/40 -mx-4 -mt-4 px-4 py-2 border-b border-[#141a2c] rounded-t-xl select-none">
                        <input
                          type="text"
                          value={f.name}
                          onChange={(e) => {
                            const updatedFields = fields.map((field) => {
                              if (field.id === f.id) return { ...field, name: e.target.value };
                              return field;
                            });
                            onUpdateNode({ fields: updatedFields, isSaved: false });
                          }}
                          className="bg-transparent border border-transparent hover:border-slate-800 text-xs font-mono font-bold uppercase tracking-wider text-slate-400 focus:border-cyan-500/30 focus:bg-[#04060b] rounded px-1.5 py-0.5 focus:outline-none w-48 cursor-pointer"
                          placeholder="Label..."
                        />

                        {fields.filter(x => x.type === 'text').length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveField(f.id)}
                            className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <textarea
                        value={f.textValue || ''}
                        rows={5}
                        onChange={(e) => {
                          const updatedFields = fields.map((field) => {
                            if (field.id === f.id) return { ...field, textValue: e.target.value };
                            return field;
                          });
                          onUpdateNode({
                            fields: updatedFields,
                            script: updatedFields.find(x => x.type === 'text')?.textValue || '',
                            isSaved: false,
                          });
                          
                          const ta = e.target;
                          ta.style.height = 'auto';
                          ta.style.height = `${ta.scrollHeight}px`;
                        }}
                        className="auto-grow-inspector w-full bg-slate-950/80 border border-[#131a2c] focus:border-cyan-550 focus:ring-1 focus:ring-cyan-500/10 rounded-lg p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none placeholder:text-slate-800 resize-none overflow-hidden block"
                        placeholder="Type text contents edge-to-edge..."
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

    </div>
  );
}
