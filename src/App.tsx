import React, { useState, useEffect, useRef } from 'react';
import NodeCanvas from './components/NodeCanvas';
import PythonBlueprint from './components/PythonBlueprint';
import { StoryNode, Connection, Group } from './types';
import { 
  GitBranch, 
  Settings, 
  Terminal, 
  HelpCircle, 
  Maximize2, 
  Save, 
  ChevronRight, 
  Layers, 
  Laptop, 
  FileCode,
  Sparkles,
  Check,
  FolderOpen,
  Plus,
  Trash2,
  Download,
  Upload,
  Info,
  ArrowLeft,
  Settings2,
  FolderSync,
  Folder,
  FileText
} from 'lucide-react';

interface SavedProject {
  id: string;
  name: string;
  updatedAt: string;
}

export default function App() {
  const [screen, setScreen] = useState<'start' | 'editor'>('start');
  const [editorTab, setEditorTab] = useState<'canvas' | 'blueprint'>('canvas');
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  const [projectId, setProjectId] = useState<string>('story_scenario_alpha');
  const [projectName, setProjectName] = useState<string>('Maskon');
  const [projectsList, setProjectsList] = useState<SavedProject[]>([]);
  
  const [theme, setTheme] = useState<'classic' | 'cosmic'>('cosmic');

  useEffect(() => {
    localStorage.setItem('story_project_editor_theme', 'cosmic');
  }, [theme]);
  
  const [newProjectInput, setNewProjectInput] = useState<string>('test');
  const [isProjectSaved, setIsProjectSaved] = useState<boolean>(true);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<SavedProject | null>(null);
  
  const [savesLocalDirectory, setSavesLocalDirectory] = useState<string>('D:\\AI\\BSC\\dist-desktop');
  const [isEditingDirectory, setIsEditingDirectory] = useState<boolean>(false);
  const [editedDirValue, setEditedDirValue] = useState<string>('D:\\AI\\BSC\\dist-desktop');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedRegistry = localStorage.getItem('story_projects_registry');
    let registry: SavedProject[] = [];
    
    if (savedRegistry) {
      try {
        registry = JSON.parse(savedRegistry);
      } catch (e) {
        console.error("Failed to parse registry", e);
      }
    }

    if (registry.length === 0) {
      registry = [
        {
          id: 'story_scenario_alpha',
          name: 'Maskon',
          updatedAt: new Date().toLocaleString()
        },
        {
          id: 'story_scenario_beta',
          name: 'Questline_Beta',
          updatedAt: new Date(Date.now() - 3600000).toLocaleString()
        }
      ];
      localStorage.setItem('story_projects_registry', JSON.stringify(registry));
      
      const initialNodes: StoryNode[] = [
        {
          id: 'node_root',
          title: 'Prologue',
          x: 350,
          y: 200,
          script: '',
          tag: 'dialogue',
          media: [],
          isSaved: true
        }
      ];
      localStorage.setItem(`story_project_story_scenario_alpha_nodes`, JSON.stringify(initialNodes));
    }

    setProjectsList(registry);

    const savedCustomPath = localStorage.getItem('story_custom_saves_dir');
    if (savedCustomPath) {
      setSavesLocalDirectory(savedCustomPath);
      setEditedDirValue(savedCustomPath);
    }
  }, []);

  useEffect(() => {
    const hasUnsavedNode = nodes.some(n => !n.isSaved);
    if (hasUnsavedNode) {
      setIsProjectSaved(false);
    }
  }, [nodes]);

  const handleSaveProject = () => {
    const updatedNodes = nodes.map(n => ({ ...n, isSaved: true }));
    setNodes(updatedNodes);
    setIsProjectSaved(true);
    
    localStorage.setItem(`story_project_${projectId}_nodes`, JSON.stringify(updatedNodes));
    localStorage.setItem(`story_project_${projectId}_connections`, JSON.stringify(connections));
    localStorage.setItem(`story_project_${projectId}_groups`, JSON.stringify(groups));
    
    const updated = projectsList.map(p => {
      if (p.id === projectId) {
        return { ...p, name: projectName, updatedAt: new Date().toLocaleString() };
      }
      return p;
    });
    setProjectsList(updated);
    localStorage.setItem('story_projects_registry', JSON.stringify(updated));

    localStorage.setItem('story_project_nodes', JSON.stringify(updatedNodes));
    localStorage.setItem('story_project_connections', JSON.stringify(connections));
    localStorage.setItem('story_project_groups', JSON.stringify(groups));
    localStorage.setItem('story_project_id', projectId);
  };

  const handleLoadProject = (proj: SavedProject) => {
    const savedNodes = localStorage.getItem(`story_project_${proj.id}_nodes`);
    const savedConns = localStorage.getItem(`story_project_${proj.id}_connections`);
    const savedGroups = localStorage.getItem(`story_project_${proj.id}_groups`);

    setProjectId(proj.id);
    setProjectName(proj.name);

    if (savedNodes) {
      try {
        setNodes(JSON.parse(savedNodes));
        setConnections(savedConns ? JSON.parse(savedConns) : []);
        setGroups(savedGroups ? JSON.parse(savedGroups) : []);
      } catch (err) {
        console.error("Failed to load project files", err);
      }
    } else {
      const rootNode: StoryNode = {
        id: 'node_root',
        title: 'Prologue',
        x: 350,
        y: 200,
        script: '',
        tag: 'dialogue',
        media: [],
        isSaved: true
      };
      setNodes([rootNode]);
      setConnections([]);
      setGroups([]);
    }
    
    setScreen('editor');
    setEditorTab('canvas');
    setTimeout(() => setIsProjectSaved(true), 50);
  };

  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectInput.trim()) return;

    const id = `project_${Date.now()}`;
    const name = newProjectInput.trim();

    const newProj: SavedProject = {
      id,
      name,
      updatedAt: new Date().toLocaleString()
    };

    const updatedRegistry = [newProj, ...projectsList];
    setProjectsList(updatedRegistry);
    localStorage.setItem('story_projects_registry', JSON.stringify(updatedRegistry));

    const firstNode: StoryNode = {
      id: 'node_root',
      title: 'Prologue',
      x: 350,
      y: 200,
      script: '',
      tag: 'dialogue',
      media: [],
      isSaved: true
    };

    setNodes([firstNode]);
    setConnections([]);
    setGroups([]);
    setProjectId(id);
    setProjectName(name);
    setScreen('editor');
    setEditorTab('canvas');
    setNewProjectInput('test');
    setIsProjectSaved(true);

    localStorage.setItem(`story_project_${id}_nodes`, JSON.stringify([firstNode]));
    localStorage.setItem(`story_project_${id}_connections`, JSON.stringify([]));
    localStorage.setItem(`story_project_${id}_groups`, JSON.stringify([]));
  };

  const handleDeleteClick = (proj: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(proj);
  };

  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    const projId = projectToDelete.id;
    const updated = projectsList.filter(p => p.id !== projId);
    setProjectsList(updated);
    localStorage.setItem('story_projects_registry', JSON.stringify(updated));

    localStorage.removeItem(`story_project_${projId}_nodes`);
    localStorage.removeItem(`story_project_${projId}_connections`);
    localStorage.removeItem(`story_project_${projId}_groups`);
    
    setProjectToDelete(null);
  };

  const handleExportProjectFile = (projId: string, projName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const savedNodes = localStorage.getItem(`story_project_${projId}_nodes`) || JSON.stringify(nodes);
    const savedConns = localStorage.getItem(`story_project_${projId}_connections`) || JSON.stringify(connections);
    const savedGroups = localStorage.getItem(`story_project_${projId}_groups`) || JSON.stringify(groups);

    const fullPayload = {
      version: "1.2.0-desktop",
      projectId: projId,
      projectName: projName,
      savesPath: `${savesLocalDirectory}/saves`,
      projectsPath: `${savesLocalDirectory}/projects`,
      nodes: JSON.parse(savedNodes),
      connections: JSON.parse(savedConns),
      groups: JSON.parse(savedGroups),
      exportedAt: new Date().toLocaleString()
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(fullPayload, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${projName.replace(/[\s\W]+/g, '_')}_scenario.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(reader.result as string);
        if (payload && payload.nodes && Array.isArray(payload.nodes)) {
          const importedId = payload.projectId || `proj_imported_${Date.now()}`;
          const isColliding = projectsList.some(p => p.id === importedId);
          const finalId = isColliding ? `${importedId}_${Math.random().toString(36).substring(2, 6)}` : importedId;
          const finalName = `${payload.projectName || 'Imported'} (${new Date().toLocaleDateString()})`;

          const newProj: SavedProject = {
            id: finalId,
            name: finalName,
            updatedAt: new Date().toLocaleString()
          };

          const updatedRegistry = [newProj, ...projectsList];
          setProjectsList(updatedRegistry);
          localStorage.setItem('story_projects_registry', JSON.stringify(updatedRegistry));

          localStorage.setItem(`story_project_${finalId}_nodes`, JSON.stringify(payload.nodes.map((n: any) => ({ ...n, isSaved: true }))));
          localStorage.setItem(`story_project_${finalId}_connections`, JSON.stringify(payload.connections || []));
          localStorage.setItem(`story_project_${finalId}_groups`, JSON.stringify(payload.groups || []));

          setProjectId(finalId);
          setProjectName(finalName);
          setNodes(payload.nodes);
          setConnections(payload.connections || []);
          setGroups(payload.groups || []);
          setScreen('editor');
          setEditorTab('canvas');
          setIsProjectSaved(true);
        } else {
          alert('Failed to read file: Nodes array not found.');
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const saveCustomDirectory = () => {
    localStorage.setItem('story_custom_saves_dir', editedDirValue);
    setSavesLocalDirectory(editedDirValue);
    setIsEditingDirectory(false);
  };

  return (
    <div className={`w-screen h-screen transition-all duration-300 overflow-hidden font-sans antialiased relative ${
      theme === 'cosmic' 
        ? 'bg-[#030611] text-slate-100 bg-gradient-to-b from-[#020512] via-[#04122d] to-[#010715]' 
        : 'bg-[#06080e] text-slate-200'
    }`}>
      
      {screen === 'start' ? (
        <div id="start-screen" className="w-full h-full flex flex-col justify-between p-6 md:p-10 relative overflow-y-auto">
          {theme === 'cosmic' ? (
            <>
              <div className="absolute top-1/10 left-1/10 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[130px] pointer-events-none animate-pulse duration-[8000ms]" />
              <div className="absolute bottom-1/10 right-1/10 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none animate-pulse duration-[12000ms]" />
              <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-[90px] pointer-events-none" />
              
              <div className="absolute top-[20%] left-[30%] w-2 h-2 rounded-full bg-cyan-300/40 blur-[1px] animate-pulse pointer-events-none" />
              <div className="absolute top-[35%] right-[20%] w-3 h-3 rounded-full bg-blue-300/25 blur-[1.5px] animate-ping duration-[4000ms] pointer-events-none" />
              <div className="absolute bottom-[28%] left-[15%] w-2.5 h-2.5 rounded-full bg-teal-400/35 blur-[1px] pointer-events-none" />
              <div className="absolute bottom-[15%] right-[40%] w-1.5 h-1.5 rounded-full bg-white/20 blur-[0.5px] pointer-events-none" />
            </>
          ) : (
            <>
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
              <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between z-10 shrink-0 select-none">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse transition-all ${
                theme === 'cosmic' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'bg-orange-500'
              }`} />
              <span className="font-mono text-xs font-black tracking-widest text-slate-200 uppercase block">
                BLACK SEA COMPANY
              </span>
            </div>

          </div>

          <div className="max-w-5xl w-full mx-auto my-auto py-8 md:grid md:grid-cols-12 gap-8 z-10 space-y-6 md:space-y-0">
            
            <div className="md:col-span-12 lg:col-span-5 flex flex-col justify-center space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
                  Black Sea <br />
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                    theme === 'cosmic' 
                      ? 'from-cyan-400 via-blue-400 to-indigo-500' 
                      : 'from-orange-400 via-amber-400 to-yellow-500'
                  }`}>
                    Company
                  </span>
                </h1>
              </div>

              <div className="bg-[#0b0d16]/80 border border-[#1d2338] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-300">
                  <Folder className={`w-4 h-4 shrink-0 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                  <span>LOCAL DIRECTORY</span>
                </div>
                
                <div className={`bg-[#05060a] border p-2.5 rounded text-[11px] font-mono select-all truncate transition-colors ${
                  theme === 'cosmic' ? 'text-cyan-400 border-cyan-500/20' : 'text-emerald-400 border-[#171c2b]'
                }`}>
                  {savesLocalDirectory}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full transition-all ${theme === 'cosmic' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'bg-orange-500'}`} />
                    <span className="font-semibold">/saves</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full transition-all ${theme === 'cosmic' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'bg-orange-500'}`} />
                    <span className="font-semibold">/projects</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 md:col-span-7 bg-[#0b0d16]/90 border border-[#1b2235] rounded-2xl p-6 shadow-2xl flex flex-col space-y-6">
              
              <form onSubmit={handleCreateNewProject} className="space-y-3">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                    CREATE NEW SCENARIO MAP:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newProjectInput}
                      onChange={(e) => setNewProjectInput(e.target.value)}
                      placeholder="e.g. test, Prologue, QuestLine_01..."
                      className="flex-1 bg-[#05060a] border border-[#21273e] text-xs text-slate-200 rounded-lg py-2.5 px-3.5 focus:outline-none focus:border-blue-500/80 transition-colors font-mono"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white hover:scale-[1.01] active:scale-100 transition-all rounded-lg text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create
                    </button>
                  </div>
                </div>
              </form>

              <div className="space-y-3 flex-1 flex flex-col min-h-[220px]">
                <div className="flex justify-between items-center border-b border-[#1b2135] pb-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
                    SAVED PROJECTS ({projectsList.length})
                  </span>
                  <span className="text-[9px] text-[#42507a] font-mono">Select a file below</span>
                </div>

                {projectsList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#1c2235] bg-[#07080f]/50 p-6 rounded-xl text-center my-auto">
                    <FolderOpen className="w-8 h-8 text-slate-600 mb-2" />
                    <span className="text-xs text-slate-500 font-mono">Project registry is empty.</span>
                    <span className="text-[11px] text-slate-600 font-sans mt-1">Type a name above and press "Create" to start!</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {projectsList.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => handleLoadProject(proj)}
                        className="group bg-[#111422]/60 hover:bg-[#15192c] border border-[#1b2138] hover:border-blue-500/40 rounded-xl p-3 flex items-center justify-between text-xs transition-all cursor-pointer duration-100"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors font-sans truncate block max-w-[200px] md:max-w-[240px]">
                              {proj.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            Project ID: <span className="text-[#3b82f6]/80">{proj.id}</span> • Edited: {proj.updatedAt}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleLoadProject(proj)}
                            className="bg-[#1c2338] hover:bg-blue-600 text-slate-300 hover:text-white px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Open
                          </button>

                          <button
                            onClick={(e) => handleExportProjectFile(proj.id, proj.name, e)}
                            className="bg-[#1c2338] hover:bg-emerald-600/30 hover:text-emerald-400 p-1.5 rounded text-slate-400 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteClick(proj, e)}
                            className="bg-[#1c2338] hover:bg-red-600/30 hover:text-red-400 p-1.5 rounded text-slate-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          id="editor-screen" 
          className={`w-full h-full flex flex-col overflow-hidden relative transition-all duration-300 ${
            theme === 'cosmic' 
              ? 'bg-gradient-to-b from-[#01040f] via-[#04122d] to-[#010613]' 
              : ''
          }`}
        >
          {theme === 'cosmic' && (
            <>
              <div className="absolute top-10 right-20 w-[450px] h-[450px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
              <div className="absolute bottom-20 left-10 w-[350px] h-[350px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
            </>
          )}
          
          <header className={`h-16 px-6 flex items-center justify-between shrink-0 select-none z-20 transition-colors duration-300 ${
            theme === 'cosmic'
              ? 'bg-[#020511]/90 backdrop-blur-md border-b border-cyan-500/25 shadow-[0_4px_30px_rgba(0,229,255,0.03)]'
              : 'bg-[#0a0c13] border-b border-[#1f253d]'
          }`}>
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              
              <button
                id="btn-return-menu-dashboard"
                onClick={() => {
                  setScreen('start');
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#121626]/80 hover:bg-[#1a2038] border border-[#232b45] text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold uppercase transition-all shrink-0 cursor-pointer"
              >
                <ArrowLeft className={`w-3.5 h-3.5 transition-colors ${
                  theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
                }`} />
                <span>Open</span>
              </button>

              <button
                id="btn-project-save-header-mobile"
                onClick={handleSaveProject}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-all active:scale-95 shrink-0 ${
                  isProjectSaved
                    ? 'bg-[#101422] text-slate-400 border-slate-800 hover:text-slate-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                }`}
              >
                {isProjectSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span className="text-white font-black">Save</span>
                  </>
                )}
              </button>

              <div className="h-5 w-[1px] bg-slate-800 shrink-0" />

              <div className="bg-[#121625] border border-slate-800 rounded-lg px-2 sm:px-2.5 py-1 flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="font-mono text-[9px] text-[#55638a] uppercase font-bold shrink-0 hidden xs:inline">PROJECT:</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    setIsProjectSaved(false);
                  }}
                  className="font-mono text-xs text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none py-0 px-1 w-20 sm:w-32 transition-colors font-bold cursor-pointer min-w-0 truncate"
                  placeholder="project_name"
                />
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 bg-[#121522] rounded-lg p-1 border border-[#1f253a] min-w-0">
              <button
                id="tab-select-canvas"
                onClick={() => setEditorTab('canvas')}
                className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 text-xs font-mono font-bold rounded-md transition-colors shrink-0 ${
                  editorTab === 'canvas'
                    ? 'bg-blue-600/15 text-[#38bdf8] border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Story </span>Canvas
              </button>
              
              <button
                id="tab-select-blueprint"
                onClick={() => setEditorTab('blueprint')}
                className={`flex items-center gap-1.5 px-2 sm:px-3.5 py-1.5 text-xs font-mono font-bold rounded-md transition-colors shrink-0 ${
                  editorTab === 'blueprint'
                    ? 'bg-blue-600/15 text-[#38bdf8] border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Python </span>Blueprint
              </button>

              <div className="h-4 w-[1px] bg-[#1d2336] mx-0.5 shrink-0" />
              <div className="py-1 px-2 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center gap-1 shrink-0 select-none">
                <span className="font-mono text-[9px] font-bold text-slate-500 hidden sm:inline">BLOCKS:</span>
                <span className="font-mono text-xs font-bold text-blue-400">{nodes.length}</span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">

              <button
                id="btn-project-settings-header"
                onClick={() => {
                  setEditedDirValue(savesLocalDirectory);
                  setShowInfoModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#121522] hover:bg-[#1a1f34] border border-[#222a42] text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold uppercase transition-all shrink-0 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-blue-400" />
                Project Settings
              </button>

              <div className="w-[1px] h-4 bg-slate-800" />

              <div className="flex items-center gap-1.5">
                <div 
                  className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-mono font-bold transition-all ${
                    isProjectSaved 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : 'bg-orange-500/10 border-orange-500/25 text-orange-400'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isProjectSaved ? 'bg-emerald-400' : 'bg-orange-500 animate-pulse'}`} />
                  {isProjectSaved ? 'SAVED' : 'CHANGED'}
                </div>

                <button
                  id="btn-project-save-header"
                  onClick={handleSaveProject}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-all active:scale-95 ${
                    isProjectSaved
                      ? 'bg-[#101422] text-slate-400 border-slate-800 hover:text-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                  }`}
                >
                  {isProjectSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Save Project
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-white" />
                      Save Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0 relative select-none">
            {editorTab === 'canvas' ? (
              <NodeCanvas
                nodes={nodes}
                connections={connections}
                setNodes={setNodes}
                setConnections={setConnections}
                groups={groups}
                setGroups={setGroups}
                theme={theme}
              />
            ) : (
              <PythonBlueprint />
            )}
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-[#020306]/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#0b0e17] border border-[#21283e] rounded-2xl shadow-2xl p-6 relative overflow-hidden flex flex-col space-y-5 animate-fade-in">
            
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

            <div className="flex justify-between items-center border-b border-[#212739] pb-3 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <FolderSync className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm tracking-wide font-sans text-slate-100 uppercase">
                  Project Settings & Save Location
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsEditingDirectory(false);
                  setShowInfoModal(false);
                }}
                className="w-6 h-6 rounded-full bg-[#1b2135] hover:bg-red-500 hover:text-white transition-colors text-xs flex items-center justify-center text-slate-400 cursor-pointer text-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed overflow-y-auto max-h-[380px] pr-1 scrollbar-styled select-text">
              
              <div className="space-y-3">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest block">Project Work Directory:</span>
                
                {isEditingDirectory ? (
                  <div className="flex gap-1.5 pt-0.5">
                    <input
                      type="text"
                      value={editedDirValue}
                      onChange={(e) => setEditedDirValue(e.target.value)}
                      className="flex-1 bg-[#050609] border border-[#2e3757] text-xs font-mono text-slate-300 rounded py-1.5 px-2.5 focus:outline-none"
                    />
                    <button
                      onClick={saveCustomDirectory}
                      className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-mono font-bold uppercase cursor-pointer"
                    >
                      OK
                    </button>
                    <button
                      onClick={() => setIsEditingDirectory(false)}
                      className="px-2.5 bg-[#171c2b] text-slate-400 hover:text-white rounded text-[10px] font-mono tracking-wider uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#070911] border border-[#1b2138] rounded-lg p-2.5 flex items-center justify-between gap-4 font-mono text-slate-400">
                    <span className={`truncate max-w-[340px] ${
                      theme === 'cosmic' ? 'text-cyan-400' : 'text-emerald-400/90'
                    }`}>{savesLocalDirectory}</span>
                    <button
                      onClick={() => {
                        setEditedDirValue(savesLocalDirectory);
                        setIsEditingDirectory(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
                    >
                      [Change Path]
                    </button>
                  </div>
                )}
                
                <p className="text-[11px] text-slate-500 font-sans">
                  The application groups save files and exports neatly in this folder tree to keep all linked media, images and outputs structured inside one place.
                </p>
              </div>

              <div className="bg-[#121626] border border-[#1f263c] rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
                  <Folder className={`w-3.5 h-3.5 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                  <span>Unified Project Tree:</span>
                </span>
                
                <div className="font-mono text-[11px] space-y-1.5 bg-[#05060b] border border-slate-800 p-3 rounded-md text-slate-300 select-all">
                  <div className="flex items-center gap-1.5">
                    <Folder className={`w-3.5 h-3.5 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                    <span>{savesLocalDirectory || 'dist-desktop'}</span>
                  </div>
                  <div className={`pl-4 flex items-center gap-1.5 pb-0.5 transition-colors ${
                    theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-400'
                  }`}>
                    <span>└──</span>
                    <Folder className={`w-3.5 h-3.5 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                    <span>saves/</span>
                  </div>
                  <div className={`pl-4 flex items-center gap-1.5 transition-colors ${
                    theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-400'
                  }`}>
                    <span>└──</span>
                    <Folder className={`w-3.5 h-3.5 transition-colors ${theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'}`} />
                    <span>projects/</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-450 font-sans">
                  Save files and asset directories are held side-by-side. The JSON graph files persist your layout, nodes, connections, and groups, while the projects subdirectory handles output story assets.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row gap-2 justify-between items-center bg-[#070911] p-3 rounded-lg border border-[#1f263c]">
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Backup Scenario Graph:</span>
                  <p className="text-[11px] text-slate-500 font-sans">Manually download the current scenario file .json instantly.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportProjectFile(projectId, projectName)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] transition-all text-white font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON
                </button>
              </div>

            </div>

            <div className="border-t border-[#1d2338] pt-3 shrink-0 flex justify-end">
              <button
                onClick={() => {
                  setIsEditingDirectory(false);
                  setShowInfoModal(false);
                }}
                className="px-5 py-2 bg-[#1b2135] hover:bg-[#232a42] text-slate-200 hover:text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#0a0d16] border border-[#21283d] rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-25 pointer-events-none transition-all ${
              theme === 'cosmic' ? 'bg-cyan-500' : 'bg-orange-500'
            }`} />
            
            <div className="flex items-start gap-3.5 mb-5 select-none">
              <div className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                theme === 'cosmic' 
                  ? 'bg-blue-950/40 border-cyan-500/20 text-cyan-400' 
                  : 'bg-orange-950/40 border-orange-500/20 text-orange-500'
              }`}>
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-sans font-bold text-slate-100 tracking-tight">
                  Delete Project
                </h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Are you sure you want to delete this project?
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#121626] border border-[#1e253c] rounded-lg font-mono text-[11px] text-slate-300">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    theme === 'cosmic' ? 'bg-cyan-400' : 'bg-orange-500'
                  }`} />
                  {projectToDelete.name}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 font-mono italic mb-6">
              * This scenario will be permanently removed. All blocks, scripts, and media files will be lost.
            </p>

            <div className="flex items-center justify-end gap-3 font-mono text-xs">
              <button
                id="btn-confirm-delete-cancel"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 bg-[#121626] hover:bg-[#1a2038] text-slate-400 hover:text-white rounded-lg transition-colors font-bold uppercase tracking-wider cursor-pointer border border-[#1e253c]"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-submit"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all font-bold uppercase tracking-wider cursor-pointer active:scale-95 shadow-lg shadow-red-950/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
