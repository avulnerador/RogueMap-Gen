

import React from 'react';
import { MapNode, NodeTypeConfig, VisualConfig } from '../types';

interface Props {
    node: MapNode;
    config: NodeTypeConfig;
    visualConfig: VisualConfig;
    onContextMenu: (e: React.MouseEvent) => void; // Used for Edit
    onHover: (id: number | null) => void;
    isHighlighted: boolean;
    onMouseDown: (e: React.MouseEvent) => void; // Used for Drag
}

export const MapNodeComponent: React.FC<Props> = ({ node, config, visualConfig, onContextMenu, onHover, isHighlighted, onMouseDown }) => {
    // Styles
    const baseSize = 60;
    const scale = node.customSize || 1.0;
    const size = baseSize * scale;
    
    // Check global toggle. Default to true if undefined (backward compatibility)
    const isGlobalGlowOn = visualConfig.globalGlowEnabled !== false;
    const glow = isGlobalGlowOn ? (node.customGlow || 0) : 0;
    
    const isTransparent = visualConfig.nodeShape === 'transparent';

    let boxShadow = 'none';
    let bg = 'transparent';
    let border = 'none';
    let borderRadius = '8px';
    let iconColor = config.iconColor || 'white';
    
    // Wrapper style for transparent mode glow
    let transparentGlowStyle: React.CSSProperties = {};

    if (isTransparent) {
        // Transparent Mode: 
        bg = 'transparent';
        border = 'none';
        
        if (glow > 0) {
            transparentGlowStyle = {
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '50%',
                boxShadow: `0 0 ${glow}px ${config.color}`,
                opacity: 0.8,
                pointerEvents: 'none',
                zIndex: -1
            };
        } else if (isHighlighted) {
            transparentGlowStyle = {
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '50%',
                boxShadow: `0 0 15px ${config.color}`,
                zIndex: -1
            };
        }

    } else {
        // Shape Mode (Circle/Square)
        if (visualConfig.nodeShape === 'circle') borderRadius = '50%';
        bg = config.color;
        border = `3px solid ${node.borderColor || config.color}`;
        
        if (glow > 0) {
            boxShadow = `0 0 ${glow}px ${glow/2}px ${config.color}`; 
        } else if (isHighlighted) {
            boxShadow = `0 0 15px ${config.color}`;
        } else {
            boxShadow = '0 4px 6px rgba(0,0,0,0.5)';
        }
    }

    const transform = isHighlighted ? 'scale(1.15)' : 'scale(1)';

    return (
        <div
            className="absolute transition-all duration-200"
            style={{
                left: node.x,
                top: node.y,
                width: size,
                height: size,
                marginLeft: -size / 2, // Anchor center
                marginTop: -size / 2, // Anchor center
                backgroundColor: bg,
                border: border,
                borderRadius: borderRadius,
                boxShadow: boxShadow,
                transform: transform,
                cursor: 'pointer',
                zIndex: isHighlighted ? 50 : 10,
                // Using standard Flexbox for centering container
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
            onContextMenu={onContextMenu} // Right click triggers Edit
            onMouseDown={onMouseDown} // Left click drag start
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(null)}
            title={`ID: ${node.id} | Type: ${config.name}\nLeft-click to drag.\nRight-click to edit.`}
        >
            {/* Backing glow for transparent mode */}
            {isTransparent && <div style={transparentGlowStyle}></div>}

            {/* ICON LAYER: Using Absolute + Transform for mathematical centering */}
            {visualConfig.showIcon && (
                <div 
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none'
                    }}
                >
                    <i 
                        className={`${node.iconClass || config.icon}`} 
                        style={{ 
                            color: iconColor, 
                            fontSize: isTransparent ? `${2 * scale}em` : `${1.4 * scale}em`,
                            // Line-height 1 ensures the icon font height doesn't create offset
                            lineHeight: 1,
                            // CRITICAL FIX: FontAwesome 6 requires font-weight 900 for Solid icons.
                            // Explicitly setting it here ensures export tools don't revert to 400.
                            fontWeight: 900 
                        }}
                    ></i>
                </div>
            )}
            
            {/* TEXT LAYER: Absolute positioning relative to center */}
            {visualConfig.showFloorNumber && (
                <div 
                    style={{ 
                        position: 'absolute',
                        left: '50%',
                        bottom: isTransparent ? '-20px' : '2px',
                        transform: 'translateX(-50%)',
                        zIndex: 20,
                        pointerEvents: 'none',
                        display: 'flex',
                        justifyContent: 'center',
                        width: 'max-content'
                    }}
                >
                    <span 
                        className={`font-bold ${isTransparent ? 'text-[10px] px-1.5 py-0.5 rounded' : 'text-[9px]'}`}
                        style={{
                            color: isTransparent ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.9)',
                            backgroundColor: isTransparent ? 'rgba(0,0,0,0.6)' : 'transparent',
                            textShadow: isTransparent ? 'none' : '0px 1px 2px rgba(0,0,0,0.8)',
                            lineHeight: '1.2'
                        }}
                    >
                        {node.type === 'start' ? 'S' : node.row}
                    </span>
                </div>
            )}

            {/* LOCK INDICATOR */}
            {node.isLocked && (
                <div className="absolute -top-1 -right-1 bg-red-600 rounded-full w-4 h-4 flex items-center justify-center border border-white z-30 shadow-sm" style={{ lineHeight: 1 }}>
                    <i className="fas fa-lock text-[8px] text-white"></i>
                </div>
            )}
        </div>
    );
};