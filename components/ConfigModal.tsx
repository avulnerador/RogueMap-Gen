import React, { useState } from 'react';
import { NodeTypeConfig } from '../types';
import { DEFAULT_NODE_TYPES } from '../constants';

interface Props {
    nodeTypes: Record<string, NodeTypeConfig>;
    setNodeTypes: React.Dispatch<React.SetStateAction<Record<string, NodeTypeConfig>>>;
    onClose: () => void;
    t: (key: string) => string;
    availableIcons: string[];
    setAvailableIcons: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ConfigModal: React.FC<Props> = ({ 
    nodeTypes, setNodeTypes, onClose, t, availableIcons, setAvailableIcons 
}) => {
    
    // State for managing the "Icon Picker" sub-view
    const [pickingIconFor, setPickingIconFor] = useState<string | null>(null);
    const [newIconInput, setNewIconInput] = useState('');

    const handleChange = (key: string, field: keyof NodeTypeConfig, value: string) => {
        setNodeTypes(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: value }
        }));
    };

    const handleApplyIconColorToAll = (color: string) => {
        setNodeTypes(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                next[key] = { ...next[key], iconColor: color };
            });
            return next;
        });
    };

    const handleApplyNodeColorToAll = (color: string) => {
        setNodeTypes(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(key => {
                next[key] = { ...next[key], color: color };
            });
            return next;
        });
    };

    const handleResetColor = (key: string, field: 'color' | 'iconColor') => {
        if (DEFAULT_NODE_TYPES[key]) {
            handleChange(key, field, DEFAULT_NODE_TYPES[key][field]);
        }
    };

    const handleAddRoomType = () => {
        const newKey = `custom_${Date.now()}`;
        const newType: NodeTypeConfig = {
            name: 'New Room',
            color: '#64748b',
            icon: 'fas fa-question',
            editable: true,
            isFixed: false,
            iconColor: '#FFFFFF'
        };
        setNodeTypes(prev => ({ ...prev, [newKey]: newType }));
    };

    const handleDeleteRoomType = (key: string) => {
        setNodeTypes(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleSelectIcon = (icon: string) => {
        if (pickingIconFor) {
            handleChange(pickingIconFor, 'icon', icon);
            setPickingIconFor(null);
        }
    };

    const handleAddIconToCollection = () => {
        if(newIconInput.trim() && !availableIcons.includes(newIconInput.trim())) {
            setAvailableIcons(prev => [...prev, newIconInput.trim()]);
            setNewIconInput('');
        }
    };

    // --- Sub-View: Icon Picker ---
    if (pickingIconFor) {
        return (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-600 flex flex-col max-h-[90vh]">
                     <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-lg">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <i className="fas fa-icons"></i> {t('selectIcon')}
                        </h2>
                        <button onClick={() => setPickingIconFor(null)} className="text-slate-400 hover:text-white">
                            <i className="fas fa-times fa-lg"></i>
                        </button>
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {/* Add New Icon Section */}
                        <div className="bg-slate-900 p-3 rounded border border-slate-700">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">{t('addIcon')}</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder={t('iconClassPlaceholder')}
                                    className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:border-blue-500 outline-none"
                                    value={newIconInput}
                                    onChange={(e) => setNewIconInput(e.target.value)}
                                />
                                <button 
                                    onClick={handleAddIconToCollection}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold text-sm"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        {/* Icon Grid */}
                        <div className="grid grid-cols-6 gap-3">
                            {availableIcons.map(icon => (
                                <button 
                                    key={icon}
                                    onClick={() => handleSelectIcon(icon)}
                                    className={`aspect-square flex flex-col items-center justify-center rounded bg-slate-700 hover:bg-blue-600 transition-colors group border border-slate-600
                                        ${nodeTypes[pickingIconFor]?.icon === icon ? 'bg-blue-600 border-blue-400' : ''}`}
                                    title={icon}
                                >
                                    <i className={`${icon} fa-lg text-slate-300 group-hover:text-white`}></i>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-end rounded-b-lg">
                        <button onClick={() => setPickingIconFor(null)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold">
                            {t('back')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Main View: Room Types Table ---
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl border border-slate-600 flex flex-col max-h-[90vh]">
                 <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-lg">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><i className="fas fa-palette"></i> {t('typeConfig')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fas fa-times fa-lg"></i></button>
                </div>

                <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase border-b border-slate-700">
                                <th className="p-2 w-1/3">{t('roomType')}</th>
                                <th className="p-2 text-center">{t('nodeColor')}</th>
                                <th className="p-2 text-center">{t('iconColor')}</th>
                                <th className="p-2 text-center">{t('defaultIcon')}</th>
                                <th className="p-2 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {(Object.entries(nodeTypes) as [string, NodeTypeConfig][]).map(([key, config]) => (
                                <tr key={key} className="border-b border-slate-700/50 hover:bg-slate-700/30 group">
                                    <td className="p-2">
                                        <input 
                                            type="text" 
                                            value={config.name}
                                            onChange={(e) => handleChange(key, 'name', e.target.value)}
                                            className="bg-transparent border-b border-transparent focus:border-blue-500 focus:bg-slate-900 outline-none w-full py-1 px-2 text-slate-200 font-medium"
                                        />
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="inline-flex items-center justify-center bg-slate-900 p-1 rounded border border-slate-600 gap-2">
                                            <input type="color" value={config.color} onChange={(e) => handleChange(key, 'color', e.target.value)} 
                                                className="w-6 h-6 rounded bg-transparent cursor-pointer border-none p-0" title={t('nodeColor')}/>
                                            <button 
                                                onClick={() => handleApplyNodeColorToAll(config.color)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                                title={t('applyToAll')}
                                            >
                                                <i className="fas fa-check-double"></i>
                                            </button>
                                            {DEFAULT_NODE_TYPES[key] && (
                                                <button 
                                                    onClick={() => handleResetColor(key, 'color')}
                                                    className="text-slate-500 hover:text-yellow-400 transition-colors"
                                                    title={t('resetDefault')}
                                                >
                                                    <i className="fas fa-undo"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="inline-flex items-center justify-center bg-slate-900 p-1 rounded border border-slate-600 gap-2">
                                            <input type="color" value={config.iconColor} onChange={(e) => handleChange(key, 'iconColor', e.target.value)} 
                                                className="w-6 h-6 rounded bg-transparent cursor-pointer border-none p-0" title={t('iconColor')}/>
                                            <button 
                                                onClick={() => handleApplyIconColorToAll(config.iconColor)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                                title={t('applyToAll')}
                                            >
                                                <i className="fas fa-check-double"></i>
                                            </button>
                                            {DEFAULT_NODE_TYPES[key] && (
                                                <button 
                                                    onClick={() => handleResetColor(key, 'iconColor')}
                                                    className="text-slate-500 hover:text-yellow-400 transition-colors"
                                                    title={t('resetDefault')}
                                                >
                                                    <i className="fas fa-undo"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2 text-center">
                                        <button 
                                            onClick={() => setPickingIconFor(key)}
                                            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 border border-slate-600 rounded px-3 py-1.5 transition-colors"
                                            title={t('selectIcon')}
                                        >
                                            <i className={`${config.icon} text-slate-200`}></i>
                                            <span className="text-xs text-slate-500 truncate max-w-[80px]">{config.icon}</span>
                                        </button>
                                    </td>
                                    <td className="p-2 text-center">
                                        {!config.isFixed && (
                                            <button 
                                                onClick={() => handleDeleteRoomType(key)}
                                                className="text-slate-600 hover:text-red-400 transition-colors p-2"
                                                title={t('deleteRoomType')}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-between rounded-b-lg">
                    <button 
                        onClick={handleAddRoomType}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold text-sm border border-slate-600 flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> {t('addRoomType')}
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg">
                        {t('done')}
                    </button>
                </div>
            </div>
        </div>
    );
};