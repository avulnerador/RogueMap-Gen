

export interface NodeTypeConfig {
    name: string;
    color: string;
    icon: string;
    editable: boolean;
    isFixed: boolean;
    iconColor: string;
}

export interface MapNode {
    id: number;
    row: number;
    type: string;
    iconClass: string;
    connections: number[];
    x: number; // Coordinate for rendering
    y: number; // Coordinate for rendering
    
    // Custom Visuals
    customSize?: number;
    customGlow?: number;
    borderColor?: string;
    isCustomHighlighted?: boolean;
    isLocked?: boolean;
}

export interface MapConfig {
    orientation: 'vertical' | 'horizontal';
    numRows: number;
    minNodesPerRow: number;
    maxNodesPerRow: number;
    bossRow: number;
    hasIntermediateBoss: boolean; // New field
    spacingX: number;
    spacingY: number;
    maxConnectionReach: number;
    randomizeNodePositions: boolean; // Field for Slay the Spire style layout
    jitterIntensity: number; // New field: 0 to 100 representing percentage of chaos
}

export interface VisualConfig {
    nodeShape: 'circle' | 'square' | 'transparent';
    showFloorNumber: boolean;
    showIcon: boolean;
    lineColorDefault: string;
    lineColorOutgoing: string;
    lineColorIncoming: string;
    theme: string;
    connectionGap: number;
    globalGlowEnabled: boolean; // New field to toggle all glows
}

export interface Theme {
    [key: string]: string;
}

export type Language = 'en' | 'pt' | 'es';