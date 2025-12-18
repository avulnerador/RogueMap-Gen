import React, { useState } from 'react';
import { MapNode, NodeTypeConfig } from '../types';
import { ICON_LIST } from '../constants';

interface Props {
    nodeId: number;
    nodes: MapNode[][];
    nodeTypes: Record<string, NodeTypeConfig>;
    onClose: () => void;
    onSave: (node: MapNode) => void;
    onDelete: (id: number) => void;
    onPromote: (id: number) => void;
    t: (key: string) => string;
}

export const EditNodeModal: React.FC<Props> = ({ nodeId, nodes, nodeTypes, onClose, onSave, onDelete, onPromote, t }) => {
    // Find node
    let foundNode: MapNode | undefined;
    nodes.flat().forEach(n => { if (n.id === nodeId) foundNode = n; });

    const [editedNode, setEditedNode] = useState<MapNode>(foundNode ? { ...foundNode } : {} as MapNode);

    if (!foundNode) return null;
    const config = nodeTypes[editedNode.type] || nodeTypes['normal'];
    const isLocked = editedNode.isLocked;

    const nextRowNodes = nodes.flat().filter(n => n.row === foundNode!.row + 1);

    const handleSave = () => {
        onSave(editedNode);
        onClose();
    };

    const handleConnectionToggle = (targetId: number) => {
        if(isLocked) return;
        const newConns = editedNode.connections.includes(targetId)
            ? editedNode.connections.filter(c => c !== targetId)
            : [...editedNode.connections, targetId];
        setEditedNode({ ...editedNode, connections: newConns });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-600 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-lg">
                    <h2 className="text-lg font-bold text-white">{t('editNode')} #{nodeId} <span className="text-slate-500 text-sm">({t('floor')} {foundNode.row})</span></h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fas fa-times fa-lg"></i></button>
                </div>

                {/* Body */}
                <div className="p-4 overflow-y-auto space-y-5 custom-scrollbar">
                    
                    {/* Lock Toggle */}
                    <div className="flex justify-end">
                        <label className="flex items-center gap-2 cursor-pointer bg-slate-700 px-3 py-1 rounded border border-slate-600">
                            <input type="checkbox" checked={editedNode.isLocked || false} onChange={e => setEditedNode({...editedNode, isLocked: e.target.checked})} />
                            <span className="text-sm font-bold text-slate-300">{editedNode.isLocked ? t('locked') : t('unlocked')}</span>
                            <i className={`fas ${editedNode.isLocked ? 'fa-lock text-red-400' : 'fa-lock-open text-green-400'}`}></i>
                        </label>
                    </div>

                    {/* Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('roomType')}</label>
                        <select 
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white disabled:opacity-50"
                            value={editedNode.type}
                            onChange={e => {
                                const newType = e.target.value;
                                setEditedNode({
                                    ...editedNode, 
                                    type: newType, 
                                    iconClass: nodeTypes[newType].icon 
                                });
                            }}
                            disabled={isLocked || config.isFixed}
                        >
                            {(Object.entries(nodeTypes) as [string, NodeTypeConfig][]).map(([key, val]) => (
                                <option key={key} value={key} disabled={val.isFixed && key !== foundNode!.type}>{val.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Icon Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('icon')}</label>
                        <div className="grid grid-cols-6 gap-2 bg-slate-900 p-2 rounded border border-slate-600">
                            {ICON_LIST.map(icon => (
                                <div 
                                    key={icon} 
                                    onClick={() => !isLocked && setEditedNode({...editedNode, iconClass: icon})}
                                    className={`aspect-square flex items-center justify-center rounded cursor-pointer transition-colors
                                        ${editedNode.iconClass === icon ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-400'}
                                        ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <i className={icon}></i>
                                </div>
                            ))}
                        </div>
                        <input 
                            type="text" 
                            className="w-full mt-2 bg-slate-900 border border-slate-600 rounded p-2 text-xs text-slate-300"
                            placeholder={t('customIcon')}
                            value={editedNode.iconClass}
                            onChange={e => !isLocked && setEditedNode({...editedNode, iconClass: e.target.value})}
                            disabled={isLocked}
                        />
                    </div>

                    {/* Visual Overrides */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('size')} (x{editedNode.customSize || 1})</label>
                            <input type="range" min="1" max="2.5" step="0.1" 
                                value={editedNode.customSize || 1}
                                onChange={e => !isLocked && setEditedNode({...editedNode, customSize: parseFloat(e.target.value)})}
                                className="w-full" disabled={isLocked}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('glow')}</label>
                            <input type="range" min="0" max="30" step="1" 
                                value={editedNode.customGlow || 0}
                                onChange={e => !isLocked && setEditedNode({...editedNode, customGlow: parseInt(e.target.value)})}
                                className="w-full" disabled={isLocked}
                            />
                        </div>
                    </div>
                    
                    {/* Border Color */}
                     <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('border')}</label>
                        <div className="flex gap-2">
                            <input type="color" 
                                value={editedNode.borderColor || nodeTypes[editedNode.type].color}
                                onChange={e => !isLocked && setEditedNode({...editedNode, borderColor: e.target.value})}
                                className="h-9 w-12 bg-transparent cursor-pointer rounded"
                                disabled={isLocked}
                            />
                            <button 
                                onClick={() => !isLocked && setEditedNode({...editedNode, borderColor: undefined})}
                                className="text-xs text-slate-400 underline hover:text-white"
                                disabled={isLocked}
                            >
                                {t('resetDefault')}
                            </button>
                        </div>
                    </div>

                    {/* Connections */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">{t('connections')}</label>
                        <div className="bg-slate-900 p-2 rounded border border-slate-600 max-h-32 overflow-y-auto space-y-1">
                            {nextRowNodes.length === 0 ? <p className="text-xs text-slate-500 italic">{t('noConnections')}</p> : 
                                nextRowNodes.map(target => (
                                    <label key={target.id} className="flex items-center gap-2 p-1 hover:bg-slate-800 rounded cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={editedNode.connections.includes(target.id)}
                                            onChange={() => handleConnectionToggle(target.id)}
                                            disabled={isLocked}
                                        />
                                        <span className="text-sm text-slate-300">Node #{target.id} ({nodeTypes[target.type]?.name})</span>
                                    </label>
                                ))
                            }
                        </div>
                    </div>

                    {/* Mini-Boss Promote */}
                    {!config.isFixed && !isLocked && (
                        <button 
                            onClick={() => onPromote(nodeId)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-sm shadow"
                        >
                            {t('promote')}
                        </button>
                    )}

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900 flex gap-3 rounded-b-lg">
                    {!config.isFixed && !isLocked && (
                        <button onClick={() => onDelete(nodeId)} className="bg-red-900/50 hover:bg-red-800 text-red-200 px-4 py-2 rounded text-sm font-bold border border-red-800">
                            {t('delete')}
                        </button>
                    )}
                    <div className="flex-1"></div>
                    <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold shadow-lg">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};