import React, { useState } from 'react';
import { pythonFiles } from '../data/pythonCode';
import { Copy, Check, FileCode, FolderClosed, Terminal, HelpCircle } from 'lucide-react';

export default function PythonBlueprint() {
  const [selectedFileIdx, setSelectedFileIdx] = useState(1); 
  const [copied, setCopied] = useState(false);

  const selectedFile = pythonFiles[selectedFileIdx];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <div id="python-blueprint" className="flex flex-col h-full bg-[#12141c] text-slate-300 font-sans">
      <div className="p-6 border-b border-[#252a3a] bg-[#161a26] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-xs border border-blue-500/20">PyQt6</span>
            Desktop Application Blueprint
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            This module provides a robust, native Python framework based on your exact specifications.
            It uses <code className="text-yellow-500 font-mono">PyQt6</code> QGraphicsScene/QGraphicsView to construct an infinite local node canvas.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0d0f16] px-3 py-2 rounded-lg border border-[#252a3a] text-xs">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-slate-300">pip install PyQt6</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="w-full lg:w-80 border-r border-[#252a3a] p-5 overflow-y-auto shrink-0 space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> Let's Setup & Run
            </h3>
            <div className="bg-[#181c2b] rounded-lg border border-[#2e354a] p-4 text-xs space-y-3">
              <p className="leading-relaxed">
                1. Make sure Python 3.9+ is installed.
              </p>
              <p className="leading-relaxed">
                2. Install required package using terminal:
                <span className="block mt-1 font-mono bg-[#0d0f16] p-2 rounded text-slate-400 border border-[#232938]">
                  pip install PyQt6
                </span>
              </p>
              <p className="leading-relaxed">
                3. Place all 6 code files inside the same folder.
              </p>
              <p className="leading-relaxed">
                4. Launch the application:
                <span className="block mt-1 font-mono bg-[#0d0f16] p-2 rounded text-slate-400 border border-[#232938]">
                  python main.py
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <FolderClosed className="w-3.5 h-3.5 text-blue-400" /> Directory Structure
            </h3>
            <div className="bg-[#0e111a] border border-[#252a3a] rounded-lg font-mono text-xs p-4 leading-relaxed text-slate-400">
              <div className="text-slate-200">📂 storyline_editor_project/</div>
              <div className="pl-4 border-l border-slate-700/50 py-1 space-y-1">
                {pythonFiles.map((file, idx) => (
                  <button
                    key={file.path}
                    id={`btn-file-tree-${file.path.replace('.', '-')}`}
                    onClick={() => setSelectedFileIdx(idx)}
                    className={`flex items-center gap-2 w-full text-left py-1 px-2 rounded transition-colors group ${
                      idx === selectedFileIdx
                        ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500'
                        : 'hover:bg-slate-800/40 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <FileCode className={`w-3.5 h-3.5 ${idx === selectedFileIdx ? 'text-blue-400' : 'text-slate-500'}`} />
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-[#0d1017]">
          <div className="px-6 py-3 border-b border-[#252a3a] bg-[#11141e] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-mono text-sm text-slate-200 font-semibold">{selectedFile.path}</span>
                <p className="text-xs text-slate-500">{selectedFile.description}</p>
              </div>
            </div>

            <button
              id="btn-copy-code"
              onClick={handleCopy}
              className={`flex items-center gap-2 text-xs font-mono font-semibold py-1.5 px-3 rounded-md transition-all ${
                copied
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed">
            <pre className="text-slate-300 p-4 bg-[#090b0e] border border-[#1b1f2b] rounded-lg overflow-x-auto whitespace-pre selection:bg-blue-600/35 select-all">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
