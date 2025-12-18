

import { MapConfig, MapNode, NodeTypeConfig } from '../types';

function getRandomNodeType(): string {
    const types = ['normal', 'elite', 'event', 'shop', 'treasure'];
    const weights = [0.45, 0.10, 0.20, 0.15, 0.10];
    const rand = Math.random();
    let sum = 0;
    for (let i = 0; i < types.length; i++) {
        sum += weights[i];
        if (rand < sum) return types[i];
    }
    return 'normal';
}

/**
 * Standard algorithm to connect two rows of nodes based on position ratios.
 * Used in both initial generation and when restructuring floors.
 */
function connectLayers(currentNodes: MapNode[], nextNodes: MapNode[]) {
    if (nextNodes.length === 0) return;

    // Reset current connections to ensure clean state if regenerating
    currentNodes.forEach(n => n.connections = []);

    // Special Case: Connecting TO a single node (Boss/Mini-Boss)
    // All current nodes point to the single next node
    if (nextNodes.length === 1) {
        currentNodes.forEach(node => {
            node.connections = [nextNodes[0].id];
        });
        return;
    }

    // Special Case: Connecting FROM a single node
    // The single node points to ALL next nodes (to ensure map allows full traversal)
    if (currentNodes.length === 1) {
         currentNodes[0].connections = nextNodes.map(n => n.id);
         return;
    }

    // Standard Grid-like logic (Many to Many)
    currentNodes.forEach((node, idx) => {
        // Calculate relative position (0.0 to 1.0)
        const ratio = currentNodes.length > 1 ? idx / (currentNodes.length - 1) : 0.5;
        
        // Map to index in next row
        const centerTargetIdx = Math.round(ratio * (nextNodes.length - 1));

        // Determine strict window based on reach (usually just 1 for cleanliness)
        const reach = 1; 
        const minIdx = Math.max(0, centerTargetIdx - reach);
        const maxIdx = Math.min(nextNodes.length - 1, centerTargetIdx + reach);

        // Create pool of candidates
        const candidates: number[] = [];
        for(let k = minIdx; k <= maxIdx; k++) {
            candidates.push(nextNodes[k].id);
        }

        // Shuffle candidates to add randomness
        candidates.sort(() => Math.random() - 0.5);

        // Decide number of connections (1 to 3 usually)
        let numConnections = 1;
        const rand = Math.random();
        if (candidates.length >= 2 && rand > 0.65) numConnections = 2;
        if (candidates.length >= 3 && rand > 0.90) numConnections = 3;

        // Assign connections
        node.connections = candidates.slice(0, numConnections);

        // Safety fallback: ensure at least one connection
        if (node.connections.length === 0) {
             node.connections.push(nextNodes[centerTargetIdx].id);
        }
    });

    // Orphan Check: Ensure every next-row node has at least one parent
    nextNodes.forEach((nextNode, nextIdx) => {
        const hasParent = currentNodes.some(p => p.connections.includes(nextNode.id));
        if (!hasParent) {
            // Find the closest parent spatially
            const targetRatio = nextNodes.length > 1 ? nextIdx / (nextNodes.length - 1) : 0.5;
            
            let bestParent = currentNodes[0];
            let minDist = Infinity;

            currentNodes.forEach((parent, parentIdx) => {
                const parentRatio = currentNodes.length > 1 ? parentIdx / (currentNodes.length - 1) : 0.5;
                const dist = Math.abs(parentRatio - targetRatio);
                if (dist < minDist) {
                    minDist = dist;
                    bestParent = parent;
                }
            });

            if (!bestParent.connections.includes(nextNode.id)) {
                bestParent.connections.push(nextNode.id);
            }
        }
    });
}

export function generateMapData(config: MapConfig, nodeTypes: Record<string, NodeTypeConfig>, existingMap?: MapNode[][]): MapNode[][] {
    const map: MapNode[][] = [];
    
    // Determine start ID to avoid collisions if we preserve locked nodes
    let maxId = 0;
    if (existingMap) {
        existingMap.flat().forEach(n => maxId = Math.max(maxId, n.id));
    }
    let nodeIdCounter = maxId + 1;
    
    // 1. Generate Rows and Nodes
    for (let r = 1; r <= config.numRows; r++) {
        const rowNodes: MapNode[] = [];
        const isFinal = r === config.numRows;
        
        // Check configured intermediate boss
        const isConfigMiniBoss = config.hasIntermediateBoss && r === config.bossRow && !isFinal;

        // Check for an EXISTING LOCKED MINI-BOSS in this row
        let lockedMiniBossNode: MapNode | undefined;
        if (existingMap && existingMap[r]) {
            lockedMiniBossNode = existingMap[r].find(n => n.isLocked && n.type === 'mini_boss_editable');
        }
        
        // If we found a locked mini-boss, force this row to be a single node containing that boss
        if (lockedMiniBossNode) {
            rowNodes.push({
                ...lockedMiniBossNode,
                row: r,
                connections: [], 
                // Coordinates recalculated later
            });
        } 
        else {
            // Standard Generation Logic
            let count: number;
            
            if (isFinal || isConfigMiniBoss) {
                count = 1;
            } else {
                count = Math.floor(Math.random() * (config.maxNodesPerRow - config.minNodesPerRow + 1)) + config.minNodesPerRow;
            }

            for (let i = 0; i < count; i++) {
                const existingNode = existingMap?.[r]?.[i];

                if (existingNode && existingNode.isLocked) {
                    // PRESERVE LOCKED NODE
                    rowNodes.push({
                        ...existingNode,
                        row: r, 
                        connections: [], 
                    });
                } else {
                    // GENERATE NEW NODE
                    let type = 'normal';
                    let customSize: number | undefined = undefined;
                    let customGlow: number | undefined = undefined;

                    if (isFinal) {
                        type = 'boss';
                    } else if (isConfigMiniBoss) {
                        type = 'mini_boss_editable';
                        // Apply Visuals automatically for generated Mini-Boss
                        customSize = 1.5;
                        customGlow = 20;
                    } else {
                        type = getRandomNodeType();
                    }

                    rowNodes.push({
                        id: nodeIdCounter++,
                        row: r,
                        type,
                        iconClass: nodeTypes[type]?.icon || 'fas fa-question',
                        connections: [],
                        x: 0,
                        y: 0,
                        customSize,
                        customGlow
                    });
                }
            }
        }
        
        map.push(rowNodes);
    }

    // Add Start Node at row 0
    let startNode: MapNode;
    const existingStart = existingMap?.[0]?.[0];
    
    if (existingStart && existingStart.isLocked) {
        startNode = {
            ...existingStart,
            row: 0,
            connections: [],
        };
    } else {
        startNode = {
            id: nodeIdCounter++,
            row: 0,
            type: 'start',
            iconClass: nodeTypes['start'].icon,
            connections: [],
            x: 0, 
            y: 0
        };
    }
    map.unshift([startNode]);

    // 2. Generate Connections using helper
    for (let r = 0; r < map.length - 1; r++) {
        connectLayers(map[r], map[r+1]);
    }

    return regenerateNodePositions(map, config);
}

/**
 * Ensures that the layout topology respects the Boss Row configuration.
 * Handles moving the boss row: 
 * 1. Creates/Promotes the boss at the new location.
 * 2. Demotes/Expands the old location if it's no longer the boss row.
 */
export function enforceBossRowTopology(map: MapNode[][], config: MapConfig, nodeTypes: Record<string, NodeTypeConfig>): MapNode[][] {
    const newMap = map.map(row => row.map(node => ({ ...node }))); // Deep copy
    const bossRowIdx = config.bossRow;

    // Iterate through all rows (except start and end) to sync state
    for (let r = 1; r < newMap.length - 1; r++) {
        const rowNodes = newMap[r];
        const isTargetBossRow = config.hasIntermediateBoss && r === bossRowIdx;

        if (isTargetBossRow) {
            // === CASE 1: This is the NEW Boss Row ===
            
            // If already correct (1 node, correct type), just ensure visuals
            if (rowNodes.length === 1 && rowNodes[0].type === 'mini_boss_editable') {
                if (!rowNodes[0].isLocked) {
                    rowNodes[0].customSize = 1.5;
                    rowNodes[0].customGlow = 20;
                }
                // Even if node exists, we re-run connections from parent to ensure they point here
                if (r > 0) connectLayers(newMap[r-1], newMap[r]);
                // And from here to children
                if (r < newMap.length - 1) connectLayers(newMap[r], newMap[r+1]);
                
                continue;
            }

            // Otherwise, we need to transform this row
            const lockedNode = rowNodes.find(n => n.isLocked);
            const survivor = lockedNode ? { ...lockedNode } : { ...rowNodes[0] };
            
            survivor.type = 'mini_boss_editable';
            survivor.iconClass = nodeTypes['mini_boss_editable']?.icon || 'fas fa-mask';
            // Clear old connections to avoid ghost links
            survivor.connections = []; 
            
            if (!survivor.isLocked) {
                survivor.customSize = 1.5;
                survivor.customGlow = 20;
            }

            // Replace row
            newMap[r] = [survivor];

            // Re-connect Layers
            if (r > 0) connectLayers(newMap[r-1], newMap[r]);
            if (r < newMap.length - 1) connectLayers(newMap[r], newMap[r+1]);

        } else {
            // === CASE 2: This is NOT the Boss Row (might be an OLD one) ===
            
            // Check if this looks like a "stale" boss row:
            // 1. It has exactly 1 node
            // 2. It is 'mini_boss_editable'
            // 3. It is NOT locked (if locked, user wants to keep it there manually)
            const singleNode = rowNodes[0];
            if (rowNodes.length === 1 && singleNode.type === 'mini_boss_editable' && !singleNode.isLocked) {
                
                // 1. Demote the survivor to a RANDOM type (not just normal)
                const newType = getRandomNodeType();
                singleNode.type = newType;
                singleNode.iconClass = nodeTypes[newType]?.icon || 'fas fa-question';
                singleNode.connections = []; // Reset connections
                delete singleNode.customSize;
                delete singleNode.customGlow;

                // 2. Expand the floor (Generate new neighbors)
                const targetCount = Math.floor(Math.random() * (config.maxNodesPerRow - config.minNodesPerRow + 1)) + config.minNodesPerRow;
                const nodesNeeded = Math.max(0, targetCount - 1);
                
                if (nodesNeeded > 0) {
                    // Calculate next safe ID
                    let maxId = 0;
                    newMap.flat().forEach(n => maxId = Math.max(maxId, n.id));

                    for (let k = 0; k < nodesNeeded; k++) {
                        const randomType = getRandomNodeType();
                        const newNode: MapNode = {
                            id: maxId + 1 + k,
                            row: r,
                            type: randomType,
                            iconClass: nodeTypes[randomType]?.icon || 'fas fa-question',
                            connections: [],
                            x: 0, 
                            y: 0
                        };
                        rowNodes.push(newNode);
                    }
                }

                // 3. VITAL: Re-run connections algorithm.
                // The single node had connections to EVERYTHING (because it was a boss).
                // We need to redistribute connections naturally (1-3 connections) for the new expanded row.
                
                // Fix incoming (Parents -> This Row)
                if (r > 0) {
                   connectLayers(newMap[r-1], newMap[r]);
                }

                // Fix outgoing (This Row -> Children)
                if (r < newMap.length - 1) {
                    connectLayers(newMap[r], newMap[r+1]);
                }
            }
        }
    }

    return newMap;
}

export function regenerateNodePositions(map: MapNode[][], config: MapConfig): MapNode[][] {
    const newMap = map.map(row => row.map(node => ({ ...node }))); 
    const NODE_VISUAL_SIZE = 70; // Approx visual size including border/padding
    
    // 1. Calculate Base Positions + Jitter
    newMap.forEach((rowNodes, rowIndex) => {
        const rowWidth = (rowNodes.length - 1) * config.spacingX;
        const startX = -rowWidth / 2;
        
        rowNodes.forEach((node, nodeIndex) => {
            // Base geometric calculation
            let calculatedX = 0;
            let calculatedY = 0;

            if (config.orientation === 'vertical') {
                calculatedX = startX + (nodeIndex * config.spacingX);
                calculatedY = rowIndex * config.spacingY;
            } else {
                calculatedY = startX + (nodeIndex * config.spacingX); 
                calculatedX = rowIndex * config.spacingY; 
            }

            // Apply Random Jitter (Slay the Spire Style) if enabled
            if (config.randomizeNodePositions) {
                const intensity = (config.jitterIntensity ?? 40) / 100;
                
                if (node.row !== 0) {
                    const maxX = config.spacingX * intensity; 
                    const maxY = config.spacingY * (intensity * 0.7); 

                    calculatedX += (Math.random() - 0.5) * maxX;
                    calculatedY += (Math.random() - 0.5) * maxY;
                }
            }

            node.x = calculatedX;
            node.y = calculatedY;
        });
    });

    // 2. Anti-Overlap Pass (Collision Prevention)
    // We only need to check this if randomization is active, otherwise the grid is perfect.
    if (config.randomizeNodePositions) {
        newMap.forEach(rowNodes => {
            // Sort nodes by their visual position (X or Y) to check immediate neighbors
            // Note: We use a shallow copy to sort so we don't mess up the connection logic order
            const sortedNodes = [...rowNodes].sort((a, b) => {
                return config.orientation === 'vertical' ? a.x - b.x : a.y - b.y;
            });

            for (let i = 1; i < sortedNodes.length; i++) {
                const prev = sortedNodes[i - 1];
                const curr = sortedNodes[i];
                // Increased gap to ensure nodes don't overlap even with high jitter
                // 70px base size + 30px buffer = 100px minimum center-to-center distance
                const minGap = NODE_VISUAL_SIZE + 30; 

                if (config.orientation === 'vertical') {
                    // Check Horizontal Distance
                    const dist = curr.x - prev.x;
                    if (dist < minGap) {
                        // Push current node to the right
                        const push = minGap - dist;
                        curr.x += push;
                    }
                } else {
                    // Check Vertical Distance (for horizontal layout)
                    const dist = curr.y - prev.y;
                    if (dist < minGap) {
                        const push = minGap - dist;
                        curr.y += push;
                    }
                }
            }
        });
    }

    // 3. Apply Manual Offsets (User Drag & Drop)
    // This happens LAST so the user has final say, relative to the calculated position
    newMap.forEach(rowNodes => {
        rowNodes.forEach(node => {
            if (node.manualOffsetX) node.x += node.manualOffsetX;
            if (node.manualOffsetY) node.y += node.manualOffsetY;
        });
    });

    return newMap;
}