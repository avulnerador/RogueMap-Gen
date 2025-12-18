

import React, { useState } from 'react';
import { MapNode, MapConfig, VisualConfig, NodeTypeConfig } from '../types';
import { MapNodeComponent } from './MapNodeComponent';

interface MapCanvasProps {
    nodes: MapNode[][];
    mapConfig: MapConfig;
    visualConfig: VisualConfig;
    nodeTypes: Record<string, NodeTypeConfig>;
    zoom: number;
    setZoom: (z: number) => void;
    pan: {x: number, y: number};
    setPan: React.Dispatch<React.SetStateAction<{x: number, y: number}>>;
    onNodeClick: (id: number) => void;
    onFitToScreen: () => void;
    onNodeDrag: (id: number, dx: number, dy: number) => void; // New prop for updating node position
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ 
    nodes, mapConfig, visualConfig, nodeTypes, 
    zoom, setZoom, pan, setPan, onNodeClick, onFitToScreen, onNodeDrag
}) => {
    const [isPanning, setIsPanning] = useState(false);
    const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

    const flatNodes = nodes.flat();

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(Math.max(0.1, Math.min(3, zoom + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        // Middle Click (Button 1) -> Fit to Screen
        if (e.button === 1) {
            e.preventDefault();
            onFitToScreen();
            return;
        }

        // Left Click (Button 0) -> Start Panning (Canvas Background)
        if(e.button === 0) { 
             setIsPanning(true);
             setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    // Triggered from Node Component on Left Click (MouseDown)
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: number) => {
        if (e.button !== 0) return; // Only process left click for node dragging
        
        e.preventDefault();
        e.stopPropagation(); // Stop propagation so Canvas Panning doesn't start
        
        setDraggingNodeId(nodeId);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;

        if (draggingNodeId !== null) {
            // Dragging a Node
            // Convert screen pixels to map units based on zoom
            const mapDx = dx / zoom;
            const mapDy = dy / zoom;
            
            onNodeDrag(draggingNodeId, mapDx, mapDy);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } 
        else if (isPanning) {
            // Panning the Canvas
            setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setDraggingNodeId(null);
    };

    // Calculate lines (Same as before)
    const lines = [];
    const nodesById = new Map<number, MapNode>(flatNodes.map(n => [n.id, n]));
    
    const isConnected = (id1: number, id2: number) => {
        const n1 = nodesById.get(id1);
        if(!n1) return false;
        return n1.connections.includes(id2);
    };

    const BASE_NODE_SIZE = 60;

    for (const node of flatNodes) {
        for (const targetId of node.connections) {
            const target = nodesById.get(targetId);
            if (target) {
                const isHighlighted = hoveredNodeId === node.id || hoveredNodeId === target.id;
                
                let stroke = visualConfig.lineColorDefault;
                let strokeWidth = 2;
                let strokeDasharray = "5,5";
                let zIndex = 0;

                if (hoveredNodeId === node.id) {
                    stroke = visualConfig.lineColorOutgoing;
                    strokeWidth = 3;
                    strokeDasharray = "0";
                    zIndex = 10;
                } else if (hoveredNodeId === target.id) {
                    stroke = visualConfig.lineColorIncoming;
                    strokeWidth = 3;
                    strokeDasharray = "5,5";
                    zIndex = 10;
                }

                // Geometry Calculation
                const r1 = (BASE_NODE_SIZE * (node.customSize || 1)) / 2;
                const r2 = (BASE_NODE_SIZE * (target.customSize || 1)) / 2;

                const dx = target.x - node.x;
                const dy = target.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let lineX1 = node.x;
                let lineY1 = node.y;
                let lineX2 = target.x;
                let lineY2 = target.y;

                if (dist > (r1 + r2)) {
                    const ux = dx / dist;
                    const uy = dy / dist;
                    const padding = visualConfig.connectionGap !== undefined ? visualConfig.connectionGap : 5;
                    const startOffset = Math.max(0, r1 + padding);
                    const endOffset = Math.max(0, r2 + padding);

                    lineX1 = node.x + ux * startOffset;
                    lineY1 = node.y + uy * startOffset;
                    lineX2 = target.x - ux * endOffset;
                    lineY2 = target.y - uy * endOffset;
                }

                lines.push(
                    <line 
                        key={`${node.id}-${target.id}`}
                        x1={lineX1} y1={lineY1}
                        x2={lineX2} y2={lineY2}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        style={{ zIndex }}
                    />
                );
            }
        }
    }

    return (
        <div 
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            // Prevent default context menu on the canvas so right click nodes works without browser menu
            onContextMenu={(e) => e.preventDefault()}
        >
            <div 
                id="map-content-layer"
                className={`transition-transform duration-75 ease-linear absolute top-0 left-0 ${draggingNodeId !== null ? 'pointer-events-none' : ''}`} // Optimization: disable pointer events on layer while dragging
                style={{ 
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0'
                }}
            >
                {/* Lines Layer */}
                <svg className="absolute top-0 left-0 overflow-visible" style={{ pointerEvents: 'none', zIndex: 0 }}>
                    {lines}
                </svg>

                {/* Nodes Layer */}
                <div className="relative z-10" style={{ pointerEvents: 'auto' }}>
                    {flatNodes.map(node => (
                        <MapNodeComponent 
                            key={node.id} 
                            node={node} 
                            config={nodeTypes[node.type]}
                            visualConfig={visualConfig}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onNodeClick(node.id);
                            }}
                            onHover={setHoveredNodeId}
                            isHighlighted={hoveredNodeId !== null && (hoveredNodeId === node.id || isConnected(node.id, hoveredNodeId) || isConnected(hoveredNodeId, node.id))}
                            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};