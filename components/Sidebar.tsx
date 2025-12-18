
import React, { useState } from 'react';
import { MapConfig, VisualConfig, Theme } from '../types';
import { THEMES } from '../constants';

interface SidebarProps {
    mapConfig: MapConfig;
    setMapConfig: React.Dispatch<React.SetStateAction<MapConfig>>;
    visualConfig: VisualConfig;
    setVisualConfig: React.Dispatch<React.SetStateAction<VisualConfig>>;
    onGenerate: () => void;
    onUpdateLayout: () => void;
    onReset: () => void;
    onOpenConfig: () => void;
    onApplyTheme: (key: string) => void;
    t: (key: string) => string;
}

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-3 text-sm font-medium transition-colors flex flex-col items-center gap-1
        ${active ? 'bg-slate-700 text-blue-400 border-b-2 border-blue-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-750'}`}
    >
        <i className={icon}></i>
        {label}
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
    mapConfig, setMapConfig, visualConfig, setVisualConfig, 
    onGenerate, onUpdateLayout, onReset, onOpenConfig, onApplyTheme, t
}) => {
    const [activeTab, setActiveTab] = useState<'layout' | 'visual'>('layout');

    const handleMapChange = (key: keyof MapConfig, val: any) => {
        setMapConfig(prev => ({ ...prev, [key]: val }));
    };

    const handleVisChange = (key: keyof VisualConfig, val: any) => {
        setVisualConfig(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col z-20 shadow-xl">
            <div className="p-4 border-b border-slate-700 bg-slate-900">
                <h1 className="text-xl font-bold text-blue-400 tracking-wider flex items-center gap-2">
                    <i className="fas fa-dungeon"></i> RogueMap do Urso <span className="text-xs text-slate-500 bg-slate-800 px-1 rounded">v2.4</span>
                </h1>
            </div>

            <div className="flex border-b border-slate-700">
                <TabButton active={activeTab === 'layout'} onClick={() => setActiveTab('layout')} icon="fas fa-layer-group" label={t('layout')} />
                <TabButton active={activeTab === 'visual'} onClick={() => setActiveTab('visual')} icon="fas fa-paint-brush" label={t('visuals')} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* LAYOUT TAB */}
                {activeTab === 'layout' && (
                    <>
                        <div className="space-y-4">
                            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">{t('structure')}</h3>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs text-slate-400">{t('orientation')}</label>
                                    <select 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-blue-500 outline-none"
                                        value={mapConfig.orientation}
                                        onChange={(e) => handleMapChange('orientation', e.target.value)}
                                    >
                                        <option value="vertical">{t('vertical')}</option>
                                        <option value="horizontal">{t('horizontal')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400">{t('floors')}</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                        value={mapConfig.numRows} 
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value);
                                            if (isNaN(val)) val = 3;
                                            // Enforce Limit: Max 30 Floors
                                            if (val > 30) val = 30;
                                            if (val < 3) val = 3;
                                            handleMapChange('numRows', val);
                                        }} 
                                        min={3} 
                                        max={30} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">{t('reach')}</label>
                                    <input type="number" className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                        value={mapConfig.maxConnectionReach} onChange={(e) => handleMapChange('maxConnectionReach', parseInt(e.target.value))} min={1} max={5} />
                                </div>
                                
                                <div>
                                    <label className="text-xs text-slate-400">{t('minNodes')}</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                        value={mapConfig.minNodesPerRow} 
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value);
                                            if(isNaN(val)) val = 1;
                                            // Enforce Limit: Max 10 (or current Max Nodes setting)
                                            const ceiling = Math.min(10, mapConfig.maxNodesPerRow);
                                            if (val > ceiling) val = ceiling;
                                            if (val < 1) val = 1;
                                            handleMapChange('minNodesPerRow', val);
                                        }} 
                                        min={1} 
                                        max={Math.min(10, mapConfig.maxNodesPerRow)} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">{t('maxNodes')}</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                        value={mapConfig.maxNodesPerRow} 
                                        onChange={(e) => {
                                            let val = parseInt(e.target.value);
                                            if(isNaN(val)) val = 2;
                                            // Enforce Limit: Max 10 Nodes per row
                                            if (val > 10) val = 10;
                                            if (val < mapConfig.minNodesPerRow) val = mapConfig.minNodesPerRow;
                                            handleMapChange('maxNodesPerRow', val);
                                        }} 
                                        min={mapConfig.minNodesPerRow} 
                                        max={10} 
                                    />
                                </div>

                                <div className="col-span-2 space-y-2 pt-2 border-t border-slate-700/50">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={mapConfig.hasIntermediateBoss} 
                                            onChange={(e) => handleMapChange('hasIntermediateBoss', e.target.checked)}
                                        />
                                        <span className="text-xs font-bold text-slate-300">{t('enableBossFloor')}</span>
                                    </label>

                                    <div className={`transition-opacity ${!mapConfig.hasIntermediateBoss ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <label className="text-xs text-slate-400">{t('bossFloor')}</label>
                                        <input type="range" className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                            value={mapConfig.bossRow} onChange={(e) => handleMapChange('bossRow', parseInt(e.target.value))} min={1} max={mapConfig.numRows - 1} disabled={!mapConfig.hasIntermediateBoss}/>
                                        <div className="text-right text-xs text-slate-500">{t('floor')}: {mapConfig.bossRow}</div>
                                    </div>
                                </div>

                                {/* Randomize Layout Controls */}
                                <div className="col-span-2 pt-2 border-t border-slate-700/50 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-900/50 rounded border border-slate-700 hover:border-blue-500/50 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={mapConfig.randomizeNodePositions || false} 
                                            onChange={(e) => handleMapChange('randomizeNodePositions', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-xs font-bold text-blue-300">{t('randomizeLayout')}</span>
                                    </label>

                                    {/* Intensity Slider - Only show if randomization is enabled */}
                                    <div className={`transition-all duration-300 ${!mapConfig.randomizeNodePositions ? 'opacity-40 pointer-events-none max-h-0 overflow-hidden' : 'max-h-20'}`}>
                                         <label className="text-xs text-slate-400 flex justify-between mb-1">
                                            {t('jitterIntensity')}
                                            <span className="text-slate-500">{mapConfig.jitterIntensity ?? 40}%</span>
                                        </label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="200" 
                                            step="5"
                                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                            value={mapConfig.jitterIntensity ?? 40}
                                            onChange={(e) => handleMapChange('jitterIntensity', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-6">{t('spacing')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-slate-400">{t('spacingX')} (Max 250)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                        value={mapConfig.spacingX} 
                                        min={30}
                                        max={250}
                                        onChange={(e) => { 
                                            let val = parseInt(e.target.value);
                                            if(isNaN(val)) val = 60;
                                            if(val > 250) val = 250;
                                            if(val < 30) val = 30;
                                            handleMapChange('spacingX', val); 
                                        }} 
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">{t('spacingY')} (Max 500)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                        value={mapConfig.spacingY} 
                                        min={30}
                                        max={500}
                                        onChange={(e) => { 
                                            let val = parseInt(e.target.value);
                                            if(isNaN(val)) val = 60;
                                            if(val > 500) val = 500;
                                            if(val < 30) val = 30;
                                            handleMapChange('spacingY', val); 
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-2">
                            <button onClick={onGenerate} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded shadow-lg transition-transform active:scale-95">
                                {t('generate')}
                            </button>
                            <button onClick={onUpdateLayout} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded">
                                {t('updateLayout')}
                            </button>
                        </div>
                    </>
                )}

                {/* VISUAL TAB */}
                {activeTab === 'visual' && (
                    <div className="space-y-4">
                        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold">{t('style')}</h3>
                        
                        <div>
                            <label className="text-xs text-slate-400">{t('shape')}</label>
                            <select 
                                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                                value={visualConfig.nodeShape}
                                onChange={(e) => handleVisChange('nodeShape', e.target.value)}
                            >
                                <option value="circle">{t('circle')}</option>
                                <option value="square">{t('square')}</option>
                                <option value="transparent">{t('transparent')}</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={visualConfig.showFloorNumber} onChange={(e) => handleVisChange('showFloorNumber', e.target.checked)} />
                                    <span className="text-sm">{t('showFloor')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={visualConfig.showIcon} onChange={(e) => handleVisChange('showIcon', e.target.checked)} />
                                    <span className="text-sm">{t('showIcons')}</span>
                                </label>
                            </div>
                            {/* Global Glow Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={visualConfig.globalGlowEnabled !== false} // Default true if undefined 
                                    onChange={(e) => handleVisChange('globalGlowEnabled', e.target.checked)} 
                                />
                                <span className="text-sm">{t('showGlow')}</span>
                            </label>
                        </div>

                        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-4">{t('lines')}</h3>
                        
                        {/* New Slider for Line Gap */}
                        <div>
                            <label className="text-xs text-slate-400 flex justify-between">
                                {t('lineGap')}
                                <span className="text-slate-500">{visualConfig.connectionGap !== undefined ? visualConfig.connectionGap : 5}px</span>
                            </label>
                            <input 
                                type="range" 
                                min="-80" 
                                max="40" 
                                step="1"
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                value={visualConfig.connectionGap !== undefined ? visualConfig.connectionGap : 5}
                                onChange={(e) => handleVisChange('connectionGap', parseInt(e.target.value))}
                            />
                            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                <span>Center</span>
                                <span>Gap</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">{t('default')}</label>
                                <input type="color" className="w-full h-8 bg-transparent cursor-pointer rounded" 
                                    value={visualConfig.lineColorDefault} onChange={(e) => handleVisChange('lineColorDefault', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">{t('incoming')}</label>
                                <input type="color" className="w-full h-8 bg-transparent cursor-pointer rounded" 
                                    value={visualConfig.lineColorIncoming} onChange={(e) => handleVisChange('lineColorIncoming', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">{t('outgoing')}</label>
                                <input type="color" className="w-full h-8 bg-transparent cursor-pointer rounded" 
                                    value={visualConfig.lineColorOutgoing} onChange={(e) => handleVisChange('lineColorOutgoing', e.target.value)} />
                            </div>
                        </div>

                        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-bold mt-4">{t('theme')}</h3>
                        <select 
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm"
                            onChange={(e) => onApplyTheme(e.target.value)}
                        >
                            {Object.keys(THEMES).map(key => (
                                <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                            ))}
                        </select>

                        <div className="pt-4 space-y-2">
                            <button onClick={onOpenConfig} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded">
                                {t('editRoomTypes')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-700 bg-slate-900">
                <button onClick={onReset} className="w-full text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <i className="fas fa-trash"></i> {t('reset')}
                </button>
            </div>
        </div>
    );
};