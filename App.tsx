

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';
import { EditNodeModal } from './components/EditNodeModal';
import { ConfigModal } from './components/ConfigModal';
import { HelpModal } from './components/HelpModal'; // Import HelpModal
import { Toolbar } from './components/Toolbar';
import { MapNode, MapConfig, VisualConfig, NodeTypeConfig, Language } from './types';
import { generateMapData, regenerateNodePositions, enforceBossRowTopology } from './utils/mapGenerator';
import { DEFAULT_MAP_CONFIG, DEFAULT_VISUAL_CONFIG, DEFAULT_NODE_TYPES, THEMES, TRANSLATIONS, ICON_LIST } from './constants';

const App: React.FC = () => {
  // --- State ---
  const [mapNodes, setMapNodes] = useState<MapNode[][]>([]);
  const [mapConfig, setMapConfig] = useState<MapConfig>(DEFAULT_MAP_CONFIG);
  const [visualConfig, setVisualConfig] = useState<VisualConfig>(DEFAULT_VISUAL_CONFIG);
  const [nodeTypes, setNodeTypes] = useState<Record<string, NodeTypeConfig>>(DEFAULT_NODE_TYPES);
  const [language, setLanguage] = useState<Language>('en'); // Default language
  const [availableIcons, setAvailableIcons] = useState<string[]>(ICON_LIST);
  
  // UI State
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false); // Help Modal State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Translation Helper
  const t = (key: string) => {
    return TRANSLATIONS[language][key] || key;
  };

  // --- Actions ---

  // Defined BEFORE handleGenerateMap so it can be used there
  const handleFitToScreen = useCallback((nodesOverride?: MapNode[][]) => {
    const nodesToUse = nodesOverride || mapNodes;
    if (!canvasRef.current || nodesToUse.length === 0) return;
    
    const nodes = nodesToUse.flat();
    if (nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
    });

    const padding = 100;
    const mapWidth = maxX - minX + padding * 2;
    const mapHeight = maxY - minY + padding * 2;
    
    const containerWidth = canvasRef.current.clientWidth;
    const containerHeight = canvasRef.current.clientHeight;

    const scaleX = containerWidth / mapWidth;
    const scaleY = containerHeight / mapHeight;
    const newScale = Math.min(scaleX, scaleY, 1); 

    setZoom(newScale);
    
    const centerX = (maxX + minX) + (mapWidth / 2) - padding; // Approximate center of nodes bounding box
    const centerY = (maxY + minY) + (mapHeight / 2) - padding; // Approximate center of nodes bounding box
    
    // Correct logic: we want (maxX + minX)/2 to be at center of screen
    const nodeCenterX = (maxX + minX) / 2;
    const nodeCenterY = (maxY + minY) / 2;

    setPan({
        x: (containerWidth / 2) - (nodeCenterX * newScale),
        y: (containerHeight / 2) - (nodeCenterY * newScale)
    });
  }, [mapNodes]);

  const handleGenerateMap = useCallback(() => {
    const newMap = generateMapData(mapConfig, nodeTypes, mapNodes);
    setMapNodes(newMap);
    // Auto-fit to screen with the new map data
    handleFitToScreen(newMap);
  }, [mapConfig, nodeTypes, mapNodes, handleFitToScreen]);

  const handleUpdateLayout = useCallback(() => {
    setMapNodes(prev => {
        // First, ensure the structure matches the new Boss Row config
        const structurallyFixedMap = enforceBossRowTopology(prev, mapConfig, nodeTypes);
        // Then recalculate positions
        return regenerateNodePositions(structurallyFixedMap, mapConfig);
    });
  }, [mapConfig, nodeTypes]);

  // Handle Manual Node Dragging with Constraints
  const handleNodeDrag = (nodeId: number, dx: number, dy: number) => {
    setMapNodes(prev => {
        const MAX_OFFSET_RADIUS = 150; // Maximum pixels a node can be dragged from its calculated origin

        return prev.map(row => row.map(node => {
            if (node.id !== nodeId) return node;

            const currentOffsetX = node.manualOffsetX || 0;
            const currentOffsetY = node.manualOffsetY || 0;

            let newOffsetX = currentOffsetX + dx;
            let newOffsetY = currentOffsetY + dy;

            // Apply circular constraint
            const dist = Math.sqrt(newOffsetX * newOffsetX + newOffsetY * newOffsetY);
            if (dist > MAX_OFFSET_RADIUS) {
                const ratio = MAX_OFFSET_RADIUS / dist;
                newOffsetX *= ratio;
                newOffsetY *= ratio;
            }

            return {
                ...node,
                x: node.x + (newOffsetX - currentOffsetX), // Apply delta to visual X immediately for smoothness
                y: node.y + (newOffsetY - currentOffsetY), // Apply delta to visual Y
                manualOffsetX: newOffsetX,
                manualOffsetY: newOffsetY
            };
        }));
    });
  };

  // --- Initialization & Persistence ---
  useEffect(() => {
    const savedMap = localStorage.getItem('roguelike_map_v2');
    const savedConfig = localStorage.getItem('roguelike_config_v2');
    const savedLang = localStorage.getItem('roguelike_lang');
    const savedIcons = localStorage.getItem('roguelike_icons');

    if (savedLang && (savedLang === 'en' || savedLang === 'pt' || savedLang === 'es')) {
        setLanguage(savedLang as Language);
    }

    if(savedIcons) {
        setAvailableIcons(JSON.parse(savedIcons));
    }

    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setMapConfig(parsed.mapConfig || DEFAULT_MAP_CONFIG);
      setVisualConfig(parsed.visualConfig || DEFAULT_VISUAL_CONFIG);
      setNodeTypes(parsed.nodeTypes || DEFAULT_NODE_TYPES);
    }

    if (savedMap) {
      const parsedMap = JSON.parse(savedMap);
      setMapNodes(parsedMap);
      // Ensure fit to screen happens after layout paint, even for loaded maps
      setTimeout(() => {
          handleFitToScreen(parsedMap);
      }, 100);
    } else {
      // If no saved map, generate one and fit it
      const newMap = generateMapData(DEFAULT_MAP_CONFIG, DEFAULT_NODE_TYPES);
      setMapNodes(newMap);
      
      // Small timeout to ensure canvasRef is mounted
      setTimeout(() => {
          handleFitToScreen(newMap);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    localStorage.setItem('roguelike_map_v2', JSON.stringify(mapNodes));
    localStorage.setItem('roguelike_config_v2', JSON.stringify({
      mapConfig,
      visualConfig,
      nodeTypes
    }));
    localStorage.setItem('roguelike_lang', language);
    localStorage.setItem('roguelike_icons', JSON.stringify(availableIcons));
  }, [mapNodes, mapConfig, visualConfig, nodeTypes, language, availableIcons]);


  const handleApplyTheme = (themeKey: string) => {
    const theme = THEMES[themeKey];
    if (!theme) return;
    
    setNodeTypes(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        if (theme[key]) next[key].color = theme[key];
      });
      return next;
    });
  };

  const handleNodeChange = (updatedNode: MapNode) => {
    setMapNodes(prev => {
      return prev.map(row => {
          if (row.some(n => n.id === updatedNode.id)) {
              return row.map(n => n.id === updatedNode.id ? updatedNode : n);
          }
          return row;
      });
    });
  };

  const handlePromoteNode = (nodeId: number) => {
    setMapNodes(prev => {
        const newMap = prev.map(row => row.map(node => ({...node})));
        let targetRowIdx = -1;
        let targetNode: MapNode | null = null;

        for(let r=0; r<newMap.length; r++) {
            const found = newMap[r].find(n => n.id === nodeId);
            if(found) {
                targetRowIdx = r;
                targetNode = found;
                break;
            }
        }

        if(!targetNode || targetRowIdx === -1) return prev;

        let nextRowIds: number[] = [];
        if (targetRowIdx < newMap.length - 1) {
            nextRowIds = newMap[targetRowIdx + 1].map(n => n.id);
        }

        targetNode.type = 'mini_boss_editable';
        targetNode.iconClass = nodeTypes['mini_boss_editable']?.icon || 'fas fa-skull';
        targetNode.customSize = 1.5;
        targetNode.customGlow = 20;
        targetNode.connections = nextRowIds; 

        newMap[targetRowIdx] = [targetNode];

        if (targetRowIdx > 0) {
            newMap[targetRowIdx - 1] = newMap[targetRowIdx - 1].map(parent => ({
                ...parent,
                connections: [targetNode!.id]
            }));
        }

        return regenerateNodePositions(newMap, mapConfig);
    });
    setEditingNodeId(null);
  };

  const handleDeleteNode = (nodeId: number) => {
    setMapNodes(prev => {
        const mapWithoutNode = prev.map(row => row.filter(n => n.id !== nodeId));
        const cleanedMap = mapWithoutNode.map(row => 
            row.map(node => ({
                ...node,
                connections: node.connections.filter(id => id !== nodeId)
            }))
        );
        return regenerateNodePositions(cleanedMap, mapConfig);
    });
    setEditingNodeId(null);
  };

  const handleReset = () => {
    if(confirm(t('confirmReset'))) {
        localStorage.removeItem('roguelike_map_v2');
        localStorage.removeItem('roguelike_config_v2');
        localStorage.removeItem('roguelike_icons');

        setMapConfig(DEFAULT_MAP_CONFIG);
        setVisualConfig(DEFAULT_VISUAL_CONFIG);
        setNodeTypes(DEFAULT_NODE_TYPES);
        setAvailableIcons(ICON_LIST);
        
        // Reset Zoom/Pan is handled by handleFitToScreen below, but we can reset basics first
        setZoom(1);

        const newMap = generateMapData(DEFAULT_MAP_CONFIG, DEFAULT_NODE_TYPES);
        setMapNodes(newMap);
        
        // Auto-fit the fresh map
        handleFitToScreen(newMap);
    }
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if (data.mapNodes && data.mapConfig) {
                setMapNodes(data.mapNodes);
                setMapConfig(data.mapConfig);
                setVisualConfig(data.visualConfig || DEFAULT_VISUAL_CONFIG);
                setNodeTypes(data.nodeTypes || DEFAULT_NODE_TYPES);
                if(data.availableIcons) {
                    setAvailableIcons(data.availableIcons);
                }
                // Auto-fit imported map
                setTimeout(() => handleFitToScreen(data.mapNodes), 50);
            } else {
                alert("Invalid JSON format.");
            }
        } catch (err) {
            alert("Error parsing JSON");
        }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    const data = {
        mapNodes,
        mapConfig,
        visualConfig,
        nodeTypes,
        availableIcons
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `roguelike_map_${new Date().getTime()}.json`;
    link.click();
  };

  return (
    <div 
        className="flex h-screen w-screen bg-gray-950 text-slate-200 font-sans overflow-hidden"
        onContextMenu={(e) => e.preventDefault()} // Disable default context menu globally
    >
      
      {/* Sidebar */}
      <Sidebar 
        mapConfig={mapConfig}
        setMapConfig={setMapConfig}
        visualConfig={visualConfig}
        setVisualConfig={setVisualConfig}
        onGenerate={handleGenerateMap}
        onUpdateLayout={handleUpdateLayout}
        onReset={handleReset}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onApplyTheme={handleApplyTheme}
        t={t}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        <Toolbar 
            onFitToScreen={() => handleFitToScreen()} // Call without args uses current state
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            zoom={zoom}
            setZoom={setZoom}
            mapNodes={mapNodes}
            language={language}
            setLanguage={setLanguage}
            t={t}
            onOpenHelp={() => setIsHelpModalOpen(true)}
        />
        
        <div className="flex-1 relative overflow-hidden bg-slate-900" ref={canvasRef}>
            <MapCanvas 
                nodes={mapNodes}
                mapConfig={mapConfig}
                visualConfig={visualConfig}
                nodeTypes={nodeTypes}
                zoom={zoom}
                pan={pan}
                setPan={setPan}
                setZoom={setZoom}
                onNodeClick={setEditingNodeId}
                onFitToScreen={() => handleFitToScreen()}
                onNodeDrag={handleNodeDrag}
            />
        </div>
      </div>

      {/* Modals */}
      {editingNodeId !== null && (
        <EditNodeModal 
            nodeId={editingNodeId}
            nodes={mapNodes}
            nodeTypes={nodeTypes}
            onClose={() => setEditingNodeId(null)}
            onSave={handleNodeChange}
            onDelete={handleDeleteNode}
            onPromote={handlePromoteNode}
            t={t}
        />
      )}

      {isConfigModalOpen && (
        <ConfigModal 
            nodeTypes={nodeTypes}
            setNodeTypes={setNodeTypes}
            onClose={() => setIsConfigModalOpen(false)}
            t={t}
            availableIcons={availableIcons}
            setAvailableIcons={setAvailableIcons}
        />
      )}

      {isHelpModalOpen && (
        <HelpModal 
            onClose={() => setIsHelpModalOpen(false)} 
            t={t} 
        />
      )}

    </div>
  );
};

export default App;