import React, { useState, useEffect, useRef } from 'react';
import NodeCanvas from './components/NodeCanvas';
import DocumentView from './components/DocumentView';
import DiagramView from './components/DiagramView';
import BroadCellInspector from './components/BroadCellInspector';
import ProjectSettings from './components/ProjectSettings';
import { StoryNode, Connection, Group, MediaFile } from './types';
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
  FileText,
  Mic,
  MicOff,
  PenLine,
  BookOpen,
  Compass
} from 'lucide-react';

interface SavedProject {
  id: string;
  name: string;
  updatedAt: string;
}

export default function App() {
  const [screen, setScreen] = useState<'start' | 'editor'>('start');
  const [editorTab, setEditorTab] = useState<'canvas' | 'document' | 'diagram'>('canvas');
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeInspectNodeId, setActiveInspectNodeId] = useState<string | null>(null);
  
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

  const [autosaveEnabled, setAutosaveEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('story_autosave_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [autosaveInterval, setAutosaveInterval] = useState<number>(() => {
    const saved = localStorage.getItem('story_autosave_interval_minutes');
    return saved !== null ? parseInt(saved, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem('story_autosave_enabled', String(autosaveEnabled));
  }, [autosaveEnabled]);

  useEffect(() => {
    localStorage.setItem('story_autosave_interval_minutes', String(autosaveInterval));
  }, [autosaveInterval]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // States for Create & Generate actions
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createProjectName, setCreateProjectName] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  
  // States for Scenario Generation Wizard
  const [wizardScenarioName, setWizardScenarioName] = useState('Voice Quest');
  const [wizardNodes, setWizardNodes] = useState<Array<{ title: string; text: string; category: 'start' | 'end' | 'variation' | 'description'; media: MediaFile[] }>>([]);
  const [wizardCurrentTitle, setWizardCurrentTitle] = useState('');
  const [wizardCurrentText, setWizardCurrentText] = useState('');
  const [wizardCurrentCategory, setWizardCurrentCategory] = useState<'start' | 'end' | 'variation' | 'description'>('start');
  const [wizardSelectedMedia, setWizardSelectedMedia] = useState<MediaFile[]>([]);
  const [isDictatingText, setIsDictatingText] = useState(false);

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
          nodeType: 'start',
          tag: 'start',
          borderColor: '#10b981',
          lineColor: '#10b981',
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
        nodeType: 'start',
        tag: 'start',
        borderColor: '#10b981',
        lineColor: '#10b981',
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
      nodeType: 'start',
      tag: 'start',
      borderColor: '#10b981',
      lineColor: '#10b981',
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

  const handleDirectCreateProject = (nameToCreate: string) => {
    if (!nameToCreate.trim()) return;

    const id = `project_${Date.now()}`;
    const name = nameToCreate.trim();

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
      nodeType: 'start',
      tag: 'start',
      borderColor: '#10b981',
      lineColor: '#10b981',
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
    setIsProjectSaved(true);

    localStorage.setItem(`story_project_${id}_nodes`, JSON.stringify([firstNode]));
    localStorage.setItem(`story_project_${id}_connections`, JSON.stringify([]));
    localStorage.setItem(`story_project_${id}_groups`, JSON.stringify([]));
  };

  const handleWizardMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const media: MediaFile = {
        id: `media_${Date.now()}`,
        name: file.name,
        type: file.type,
        dataUrl: reader.result as string,
        size: file.size
      };
      setWizardSelectedMedia([media]);
    };
    reader.readAsDataURL(file);
  };

  const toggleSpeechInput = () => {
    if (isDictatingText) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsDictatingText(false);
      return;
    }

    const SpeechAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechAPI) {
      alert("Speech recognition API is not supported in this browser. Please type directly into the text area!");
      return;
    }

    try {
      const recognition = new SpeechAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsDictatingText(true);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
      };

      recognition.onend = () => {
        setIsDictatingText(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setWizardCurrentText(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (err) {
      console.error("Speech Recognition Initialization Failed", err);
      setIsDictatingText(false);
    }
  };

  const handleWizardFinishAndGenerate = (scenarioName: string) => {
    let nodesToCompile = [...wizardNodes];
    if (wizardCurrentText.trim()) {
      nodesToCompile.push({
        title: wizardCurrentTitle.trim(),
        text: wizardCurrentText.trim(),
        category: wizardCurrentCategory,
        media: wizardSelectedMedia
      });
    }

    if (nodesToCompile.length === 0) {
      alert("No story nodes were recorded yet. Please narrate at least one block to build a scenario map!");
      return;
    }

    const id = `project_generated_${Date.now()}`;
    const name = scenarioName.trim() || `Generated Scenario Map`;

    const newProj: SavedProject = {
      id,
      name,
      updatedAt: new Date().toLocaleString()
    };

    const updatedRegistry = [newProj, ...projectsList];
    setProjectsList(updatedRegistry);
    localStorage.setItem('story_projects_registry', JSON.stringify(updatedRegistry));

    const generatedNodes: StoryNode[] = nodesToCompile.map((item, index) => {
      const nodeId = index === 0 ? 'node_root' : `node_gen_${Date.now()}_${index}`;
      
      // Enforce: first block must be 'start' (Green), last block must be 'end' (Red)
      let finalCategory: 'start' | 'end' | 'variation' | 'description' = item.category;
      if (index === 0) {
        finalCategory = 'start';
      } else if (index === nodesToCompile.length - 1 && nodesToCompile.length > 1) {
        finalCategory = 'end';
      }

      const borderColor = finalCategory === 'start' 
        ? '#10b981' 
        : finalCategory === 'end' 
        ? '#ef4444' 
        : finalCategory === 'variation' 
        ? '#f97316' 
        : '#3b82f6';
      
      const lineColor = borderColor;
      const tag = finalCategory === 'start' 
        ? 'start' 
        : finalCategory === 'end' 
        ? 'end' 
        : finalCategory === 'variation' 
        ? 'variation' 
        : 'description';

      const title = item.title.trim() || (
        finalCategory === 'start' 
          ? `Start Block` 
          : finalCategory === 'end'
          ? `End Block`
          : finalCategory === 'variation'
          ? `Variation Block ${index + 1}`
          : `Description Block ${index + 1}`
      );

      return {
        id: nodeId,
        title,
        x: 350 + index * 420,
        y: 250,
        script: item.text,
        tag,
        nodeType: finalCategory,
        media: item.media || [],
        borderColor,
        lineColor,
        isSaved: true
      };
    });

    const generatedConnections: Connection[] = [];
    for (let i = 0; i < generatedNodes.length - 1; i++) {
      generatedConnections.push({
        id: `conn_gen_${Date.now()}_${i}`,
        fromId: generatedNodes[i].id,
        toId: generatedNodes[i + 1].id,
        color: generatedNodes[i].lineColor || '#0284c7',
        thickness: 2.5,
        style: 'solid'
      });
    }

    setNodes(generatedNodes);
    setConnections(generatedConnections);
    setGroups([]);
    setProjectId(id);
    setProjectName(name);
    setScreen('editor');
    setEditorTab('canvas');
    setIsProjectSaved(true);

    localStorage.setItem(`story_project_${id}_nodes`, JSON.stringify(generatedNodes));
    localStorage.setItem(`story_project_${id}_connections`, JSON.stringify(generatedConnections));
    localStorage.setItem(`story_project_${id}_groups`, JSON.stringify([]));

    // Reset wizard input fields
    setWizardNodes([]);
    setWizardCurrentTitle('');
    setWizardCurrentText('');
    setWizardCurrentCategory('start');
    setWizardSelectedMedia([]);

    setIsGeneratorOpen(false);
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
      
      {showInfoModal ? (
        <ProjectSettings
          autosaveEnabled={autosaveEnabled}
          setAutosaveEnabled={setAutosaveEnabled}
          autosaveInterval={autosaveInterval}
          setAutosaveInterval={setAutosaveInterval}
          savesLocalDirectory={savesLocalDirectory}
          setSavesLocalDirectory={setSavesLocalDirectory}
          isEditingDirectory={isEditingDirectory}
          setIsEditingDirectory={setIsEditingDirectory}
          editedDirValue={editedDirValue}
          setEditedDirValue={setEditedDirValue}
          saveCustomDirectory={saveCustomDirectory}
          onExportProjectFile={() => handleExportProjectFile(projectId, projectName)}
          onBack={() => {
            setIsEditingDirectory(false);
            setShowInfoModal(false);
          }}
          theme={theme}
        />
      ) : screen === 'start' ? (
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

          <div id="dashboard-start-wrapper" className="max-w-xl w-full mx-auto my-auto py-6 flex flex-col space-y-5 z-10">
            {/* Black Sea Company in large letters at the very top */}
            <div className="text-center select-none pt-4 pb-2">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
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

            {/* Settings right below */}
            <div 
              onClick={() => {
                setEditedDirValue(savesLocalDirectory);
                setShowInfoModal(true);
              }}
              className="bg-[#0b0d16]/80 border border-[#1d2338] hover:border-blue-500/40 rounded-xl p-4 flex items-center justify-between text-xs cursor-pointer select-none transition-all hover:bg-[#111422]/60 group"
            >
              <div className="flex items-center gap-2">
                <Settings className={`w-4 h-4 shrink-0 group-hover:rotate-45 transition-transform duration-300 ${
                  theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
                }`} />
                <span className="font-sans font-bold text-slate-200">
                  Settings (Local Directory)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </div>

            {/* Everything else (Create/Generate and Saved Projects block) */}
            <div className="bg-[#0b0d16]/90 border border-[#1b2235] rounded-2xl p-6 shadow-2xl flex flex-col space-y-6">
              
              <div className="space-y-3">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider block">
                    Create and Write:
                  </label>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(true);
                        setCreateProjectName('');
                      }}
                      className="h-11 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 active:scale-95 text-white transition-all rounded-lg text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-950/40"
                    >
                      <Plus className="w-4 h-4 shrink-0 font-bold" />
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsGeneratorOpen(true);
                        setWizardScenarioName('Scenario Draft');
                        setWizardNodes([]);
                        setWizardCurrentText('');
                        setWizardCurrentCategory('start');
                        setWizardSelectedMedia([]);
                      }}
                      className="h-11 bg-[#121626]/90 hover:bg-[#1b213b] border border-[#2e3758] hover:border-blue-500/50 hover:text-white transition-all text-slate-300 rounded-lg text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                    >
                      <PenLine className="w-4 h-4 text-cyan-400 shrink-0" />
                      Write
                    </button>
                  </div>
                </div>
              </div>

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
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 active:scale-95 text-white px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-100 cursor-pointer shadow-md shadow-indigo-950/20"
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
        activeInspectNodeId !== null && nodes.find(n => n.id === activeInspectNodeId) ? (
          <BroadCellInspector
            node={nodes.find(n => n.id === activeInspectNodeId)!}
            onUpdateNode={(updates) => {
              setNodes(prev => prev.map(n => n.id === activeInspectNodeId ? { ...n, ...updates, isSaved: false } : n));
            }}
            onBack={() => setActiveInspectNodeId(null)}
            theme={theme}
          />
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
                   <header className={`h-16 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20 transition-colors duration-300 ${
            theme === 'cosmic'
              ? 'bg-[#020511]/90 backdrop-blur-md border-b border-cyan-500/25 shadow-[0_4px_30px_rgba(0,229,255,0.03)]'
              : 'bg-[#0a0c13] border-b border-[#1f253d]'
          }`}>
            
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              
              <button
                id="btn-return-menu-dashboard"
                onClick={() => {
                  setScreen('start');
                }}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 bg-[#121626]/80 hover:bg-[#1a2038] border border-[#232b45] text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold uppercase transition-all shrink-0 cursor-pointer"
              >
                <ArrowLeft className={`w-3.5 h-3.5 transition-colors ${
                  theme === 'cosmic' ? 'text-cyan-400' : 'text-orange-500'
                }`} />
                <span className="hidden sm:inline">Open</span>
              </button>

              <button
                id="btn-project-save-header-mobile"
                onClick={handleSaveProject}
                className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-all active:scale-90 duration-75 shrink-0 ${
                  isProjectSaved
                    ? 'bg-[#101422] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 active:bg-[#070911] active:text-slate-150'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10 active:bg-emerald-700 active:border-emerald-700'
                }`}
              >
                {isProjectSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-white animate-pulse" />
                    <span className="text-white font-black hidden sm:inline">Save</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1 bg-[#121522] rounded-lg p-1 border border-[#1f253a] min-w-0">
              <button
                id="tab-select-canvas"
                onClick={() => setEditorTab('canvas')}
                className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 text-xs font-mono font-bold rounded-md transition-colors shrink-0 ${
                  editorTab === 'canvas'
                    ? 'bg-blue-600/15 text-[#38bdf8] border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Canvas</span>
              </button>

              <button
                id="tab-select-document"
                onClick={() => setEditorTab('document')}
                className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 text-xs font-mono font-bold rounded-md transition-colors shrink-0 ${
                  editorTab === 'document'
                    ? 'bg-blue-600/15 text-[#38bdf8] border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Document</span>
              </button>

              <button
                id="tab-select-diagram"
                onClick={() => setEditorTab('diagram')}
                className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 text-xs font-mono font-bold rounded-md transition-colors shrink-0 ${
                  editorTab === 'diagram'
                    ? 'bg-blue-600/15 text-[#38bdf8] border border-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Diagram</span>
              </button>

              <div className="h-4 w-[1px] bg-[#1d2336] mx-0.5 shrink-0 hidden xs:block" />
              <div className="py-1 px-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center gap-1 shrink-0 select-none hidden xs:flex">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-all active:scale-90 duration-75 ${
                    isProjectSaved
                      ? 'bg-[#101422] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700 active:bg-[#070911] active:text-slate-150'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10 active:bg-emerald-700 active:border-emerald-700'
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

          {/* SEPARATE PROJECT NAME HORIZONTAL BLOCK */}
          <div className="bg-[#030613]/95 border-b border-cyan-500/20 px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between z-10 select-none gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[9px] font-mono text-cyan-400 font-bold tracking-wider uppercase shrink-0">SCENARIO PROJECT:</span>
              <input
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setIsProjectSaved(false);
                }}
                className="font-sans text-xs font-bold text-slate-100 bg-transparent shrink-0 border-b border-transparent hover:border-slate-850 focus:border-cyan-500/50 focus:outline-none py-0.5 px-2 w-full max-w-sm transition-all"
                placeholder="Enter Project Name..."
              />
            </div>
          </div>

          <div className={`flex-1 min-h-0 relative w-full h-full flex flex-col ${editorTab !== 'canvas' ? 'select-text' : 'select-none'}`}>
            {editorTab === 'canvas' ? (
              <NodeCanvas
                nodes={nodes}
                connections={connections}
                setNodes={setNodes}
                setConnections={setConnections}
                groups={groups}
                setGroups={setGroups}
                theme={theme}
                autosaveEnabled={autosaveEnabled}
                autosaveInterval={autosaveInterval}
                onSaveProject={handleSaveProject}
                onInspectNode={setActiveInspectNodeId}
              />
            ) : editorTab === 'document' ? (
              <DocumentView
                projectName={projectName}
                nodes={nodes}
                connections={connections}
                theme={theme}
              />
            ) : (
              <DiagramView
                projectName={projectName}
                nodes={nodes}
                connections={connections}
                theme={theme}
              />
            )}
          </div>
        </div>
        )
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

      {/* CREATE NEW MAP DIRECTLY OVERLAY */}
      {isCreateModalOpen && (
        <div id="direct-create-modal" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="w-full max-w-md bg-[#0b0e1a] border border-[#212a45] rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all ${
              theme === 'cosmic' ? 'bg-cyan-500' : 'bg-orange-500'
            }`} />
            
            <div className="flex items-start gap-4 mb-6 select-none">
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 rounded-xl shrink-0">
                <Plus className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5 w-full">
                <h3 className="text-base font-bold text-slate-100 tracking-tight uppercase">
                  Create New Scenario Map
                </h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">
                  Name your scenario map file. Once created, a clean interactive canvas will open for visual scripting.
                </p>
                <div className="pt-3">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={createProjectName}
                    onChange={(e) => setCreateProjectName(e.target.value)}
                    placeholder="Enter scenario name..."
                    className="w-full bg-[#05060b] border border-[#2a3454] text-xs text-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all font-mono placeholder-slate-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && createProjectName.trim()) {
                        handleDirectCreateProject(createProjectName);
                        setIsCreateModalOpen(false);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3.5 pt-4 border-t border-[#1d233c] font-mono text-xs">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-5 py-2.5 bg-[#121626] hover:bg-[#1b213b] text-slate-400 hover:text-white rounded-xl transition-all font-bold uppercase tracking-wider cursor-pointer border border-[#2e3758]"
              >
                Cancel
              </button>
              <button
                disabled={!createProjectName.trim()}
                onClick={() => {
                  handleDirectCreateProject(createProjectName);
                  setIsCreateModalOpen(false);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all font-bold uppercase tracking-wider cursor-pointer active:scale-95 shadow-lg disabled:opacity-40 disabled:pointer-events-none"
              >
                Create map
              </button>
            </div>
          </div>
        </div>
      )}      {/* MAGNIFICENT DYNAMIC VOICE GENERATION SCENARIO WIZARD OVERLAY */}
      {isGeneratorOpen && (
        <div id="voice-generator-wizard" className="fixed inset-0 z-[100] bg-[#02040a] min-h-screen overflow-y-auto font-sans text-slate-100 flex flex-col select-none scroll-smooth">
          <div className="max-w-xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col space-y-6 flex-1">
            
            {/* Background glowing elements to match cosmic theme */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

            {/* Header: Change "AI Scenario Builder" to "Builder" */}
            <div className="flex items-center justify-between border-b border-[#1d2542] pb-4 shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl">
                  <Sparkles className="w-4 h-4 animate-spin role-img" style={{ animationDuration: '10s' }} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">Builder</h2>
                  <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">Narrative Block Sequence Dictation</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  if (isDictatingText && speechRecognitionRef.current) {
                    speechRecognitionRef.current.stop();
                  }
                  setIsGeneratorOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-[#141b33] text-slate-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Scenario Name Area: MAP/PROJECT TITLE */}
            <div className="z-10 bg-[#05070c] border border-[#1b223d] rounded-2xl p-4 focus-within:border-cyan-500/40 transition-all">
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-mono text-[#5c6f9e] font-bold uppercase tracking-wider block">SCENARIO MAP TITLE:</span>
                <input
                  type="text"
                  value={wizardScenarioName}
                  onChange={(e) => setWizardScenarioName(e.target.value)}
                  className="w-full bg-transparent border-none text-xs text-slate-100 font-bold focus:outline-none placeholder-slate-700 focus:ring-0 p-0"
                  placeholder="Enter Title Name..."
                />
              </div>
            </div>

            {/* Unified Form for drafting the current Node Block */}
            <div className="z-10 bg-[#05070c]/90 border border-[#1d2542] rounded-2xl p-5 space-y-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between border-b border-[#1b223d] pb-2">
                <h3 className="text-[11px] font-bold text-slate-350 font-mono uppercase tracking-wider">
                  Draft Block #{wizardNodes.length + 1}
                </h3>
                <span className="text-[8.5px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 uppercase">
                  Active Draft
                </span>
              </div>

              {/* 1. Title Input */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-[#5c6f9e] font-bold uppercase tracking-wider block">BLOCK TITLE:</span>
                <input
                  type="text"
                  value={wizardCurrentTitle}
                  onChange={(e) => setWizardCurrentTitle(e.target.value)}
                  className="w-full bg-[#030509] border border-[#1e2744] text-xs text-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/10 transition-all font-sans"
                  placeholder={`Block #${wizardNodes.length + 1} Name...`}
                />
              </div>

              {/* 2. Media Field */}
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-[#5c6f9e] font-bold uppercase tracking-wider block">BLOCK MEDIA (OPTIONAL):</span>
                {wizardSelectedMedia.length === 0 ? (
                  <div className="w-full border border-dashed border-[#273254] hover:border-cyan-500/50 bg-[#03050a] rounded-xl flex flex-col items-center justify-center p-4 transition-all duration-150">
                    <Upload className="w-4 h-4 text-slate-500 mb-1" />
                    <span className="text-[9px] text-slate-400 font-semibold uppercase">Assign Block Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWizardMediaUpload}
                      className="hidden"
                      id="wizard-file-picker-direct"
                    />
                    <label
                      htmlFor="wizard-file-picker-direct"
                      className="mt-1.5 px-3 py-1 bg-[#141b33] hover:bg-[#1a2342] text-slate-300 rounded-lg text-[8px] font-bold uppercase transition-colors cursor-pointer border border-[#212b4d]"
                    >
                      Browse
                    </label>
                  </div>
                ) : (
                  <div className="w-full relative rounded-xl overflow-hidden border border-[#1b223d] bg-black shadow-lg">
                    <img 
                      src={wizardSelectedMedia[0].dataUrl} 
                      alt="preview" 
                      className="w-full object-cover max-h-[90px]" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent flex items-end p-2 justify-between">
                      <span className="text-[8px] font-mono text-cyan-300 truncate max-w-[200px]">{wizardSelectedMedia[0].name}</span>
                      <button
                        type="button"
                        onClick={() => setWizardSelectedMedia([])}
                        className="px-2 py-1 bg-red-650 hover:bg-red-600 text-white font-mono text-[8px] font-bold rounded uppercase cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Classification of types */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-[#5c6f9e] font-bold uppercase tracking-wider block">
                  CLASSIFICATION TYPE:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Start (Green) */}
                  <button
                    type="button"
                    disabled={wizardNodes.length > 0}
                    onClick={() => setWizardCurrentCategory('start')}
                    className={`h-12 border rounded-xl flex items-center justify-center text-center transition-all duration-500 active:scale-95 cursor-pointer bg-[size:200%_200%] hover:bg-[position:right_bottom] font-sans text-[10px] font-black uppercase ${
                      wizardCurrentCategory === 'start'
                        ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-violet-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.355)] ring-1 ring-emerald-400/40 scale-[1.02]'
                        : 'bg-emerald-950/10 border-emerald-950/30 text-slate-500 opacity-40 hover:opacity-70'
                    }`}
                  >
                    Start
                  </button>

                  {/* Description (Blue) */}
                  <button
                    type="button"
                    disabled={wizardNodes.length === 0}
                    onClick={() => setWizardCurrentCategory('description')}
                    className={`h-12 border rounded-xl flex items-center justify-center text-center transition-all duration-500 active:scale-95 cursor-pointer bg-[size:200%_200%] hover:bg-[position:right_bottom] font-sans text-[10px] font-black uppercase ${
                      wizardCurrentCategory === 'description'
                        ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.355)] ring-1 ring-blue-400/40 scale-[1.02]'
                        : 'bg-blue-950/10 border-blue-950/30 text-slate-400 hover:opacity-85'
                    }`}
                  >
                    Description
                  </button>

                   {/* Variation (Orange) */}
                  <button
                    type="button"
                    disabled={wizardNodes.length === 0}
                    onClick={() => setWizardCurrentCategory('variation')}
                    className={`h-12 border rounded-xl flex items-center justify-center text-center transition-all duration-500 active:scale-95 cursor-pointer bg-[size:200%_200%] hover:bg-[position:right_bottom] font-sans text-[10px] font-black uppercase ${
                      wizardCurrentCategory === 'variation'
                        ? 'bg-gradient-to-br from-orange-400 via-amber-500 to-red-600 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.355)] ring-1 ring-orange-400/40 scale-[1.02]'
                        : 'bg-orange-950/10 border-orange-950/30 text-slate-400 hover:opacity-85'
                    }`}
                  >
                    Variation
                  </button>

                  {/* End (Red) */}
                  <button
                    type="button"
                    disabled={wizardNodes.length === 0}
                    onClick={() => setWizardCurrentCategory('end')}
                    className={`h-12 border rounded-xl flex items-center justify-center text-center transition-all duration-500 active:scale-95 cursor-pointer bg-[size:200%_200%] hover:bg-[position:right_bottom] font-sans text-[10px] font-black uppercase ${
                      wizardCurrentCategory === 'end'
                        ? 'bg-gradient-to-br from-red-500 via-rose-500 to-purple-700 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.355)] ring-1 ring-red-400/40 scale-[1.02]'
                        : 'bg-red-950/10 border-red-950/30 text-slate-400 hover:opacity-85'
                    }`}
                  >
                    End
                  </button>
                </div>
              </div>

              {/* 4. Narration Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono font-[#5c6f9e] tracking-wider uppercase">CONTENT:</span>
                  <span className="text-[8px] font-mono text-[#5c6f9e] uppercase">{isDictatingText ? '🎙️ Mic active' : 'keyboard ready'}</span>
                </div>

                <div className="relative bg-[#030509] border border-[#1e2744] rounded-2xl p-4 transition-all focus-within:border-cyan-500/40">
                  <textarea
                    required
                    value={wizardCurrentText}
                    onChange={(e) => setWizardCurrentText(e.target.value)}
                    placeholder="Describe what is happening in this block, or type the actual dialogue for characters..."
                    className="w-full h-24 bg-transparent text-slate-200 text-xs focus:outline-none resize-none font-sans leading-relaxed placeholder-slate-700 focus:ring-0 p-0"
                  />

                  {/* Floating recording controls */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                    {isDictatingText && (
                      <div className="flex gap-0.5 items-center mr-2 animate-pulse">
                        <span className="w-0.5 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 h-5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <span className="w-0.5 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={toggleSpeechInput}
                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                        isDictatingText 
                          ? 'bg-red-650 hover:bg-red-600 text-white animate-pulse' 
                          : 'bg-cyan-500 hover:bg-cyan-400 text-[#090b14]'
                      } cursor-pointer shadow-md`}
                      title={isDictatingText ? 'Stop listening' : 'Start speech'}
                    >
                      {isDictatingText ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Save block */}
              <button
                type="button"
                disabled={!wizardCurrentText.trim()}
                onClick={() => {
                  const defaultTitle = wizardNodes.length === 0 
                    ? 'Start Block' 
                    : `Block ${wizardNodes.length + 1}`;
                  setWizardNodes(prev => [
                    ...prev,
                    {
                      title: wizardCurrentTitle.trim() || defaultTitle,
                      text: wizardCurrentText.trim(),
                      category: wizardCurrentCategory,
                      media: wizardSelectedMedia
                    }
                  ]);
                  setWizardCurrentTitle('');
                  setWizardCurrentText('');
                  setWizardSelectedMedia([]);
                  setWizardCurrentCategory('description'); // next ones default to description
                }}
                className="w-full py-2.5 bg-[#141b33] hover:bg-cyan-500 hover:text-[#090b14] text-cyan-300 border border-cyan-500/20 rounded-xl uppercase tracking-wider font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer text-center text-[10px]"
              >
                + Add Block
              </button>
            </div>

            {/* Generated & Drafted Block sequence progression display */}
            {wizardNodes.length > 0 && (
              <div className="space-y-2 z-10 font-sans">
                <span className="text-[9px] font-mono font-bold text-[#5c6f9e] uppercase tracking-wider block">Sequence Progression:</span>
                <div className="flex flex-wrap items-center gap-1.5 p-3 bg-[#05060b] border border-[#1b223d] rounded-xl overflow-x-auto max-h-[120px]">
                  {wizardNodes.map((node, idx) => {
                    const finalCat = idx === 0 
                      ? 'start' 
                      : (idx === wizardNodes.length - 1 ? 'end' : node.category);

                    return (
                      <React.Fragment key={idx}>
                        <div className={`px-2 py-1 rounded-lg border text-[8px] font-mono font-bold flex items-center gap-1.5 uppercase shrink-0 ${
                          finalCat === 'start' 
                            ? 'bg-[#10b981]/10 border-[#10b981]/30 text-emerald-400' 
                            : finalCat === 'end'
                            ? 'bg-[#ef4444]/10 border-[#ef4444]/30 text-red-400'
                            : finalCat === 'variation'
                            ? 'bg-[#f97316]/10 border-[#f97316]/30 text-amber-500'
                            : 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-blue-400'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{
                            backgroundColor: finalCat === 'start' 
                              ? '#10b981' 
                              : finalCat === 'end' 
                              ? '#ef4444' 
                              : finalCat === 'variation' 
                              ? '#f97316' 
                              : '#3b82f6'
                          }} />
                          <span>{idx+1}</span>
                          <span className="truncate max-w-[85px] font-sans font-medium">{node.title}</span>
                        </div>
                        {idx < wizardNodes.length - 1 && <span className="text-slate-600 font-mono text-[8.5px]">➔</span>}
                      </React.Fragment>
                    );
                  })}
                  <span className="text-slate-600 font-mono text-[8.5px]">➔</span>
                  <div className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-[8px] font-mono font-bold text-cyan-300 animate-pulse uppercase max-w-[120px] truncate">
                    {wizardCurrentText.trim() ? (wizardCurrentTitle.trim() || `Block ${wizardNodes.length + 1}`) : 'DRAFT'}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Panel Buttons: Place Cancel, and then Finish at the absolute bottom */}
            <div className="pt-4 border-t border-[#1d2542] flex flex-col gap-3 shrink-0 z-10 font-mono text-[10px]">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (isDictatingText && speechRecognitionRef.current) {
                      speechRecognitionRef.current.stop();
                    }
                    setIsGeneratorOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-[#121626] hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl uppercase tracking-wider transition-colors cursor-pointer border border-[#2e3758] h-10 text-center font-bold"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={wizardNodes.length === 0 && !wizardCurrentText.trim()}
                  onClick={() => handleWizardFinishAndGenerate(wizardScenarioName)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-650 hover:from-cyan-400 hover:to-blue-550 text-white rounded-xl uppercase tracking-widest font-bold transition-all shadow-lg active:scale-95 disabled:opacity-45 disabled:pointer-events-none cursor-pointer h-10 text-center"
                >
                  Build
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
