
import React, { useRef, useState } from 'react';
import { MapNode, Language } from '../types';
import { toPng, toJpeg } from 'html-to-image';

interface ToolbarProps {
    onFitToScreen: () => void;
    onExportJSON: () => void;
    onImportJSON: (file: File) => void;
    zoom: number;
    setZoom: (z: number) => void;
    mapNodes: MapNode[][];
    language: Language;
    setLanguage: (l: Language) => void;
    t: (key: string) => string;
    onOpenHelp: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
    onFitToScreen, onExportJSON, onImportJSON, zoom, setZoom, mapNodes, 
    language, setLanguage, t, onOpenHelp
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);

    // This function creates a temporary clone of the map content
    // We do this to capture the entire map (not just what's visible on screen)
    // and to remove any zoom/pan transforms before capturing.
    const prepareClone = (sourceElement: HTMLElement, nodes: MapNode[]) => {
        // 1. Calculate the bounding box of the actual content
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });

        // Add padding around the map
        const padding = 150;
        const width = (maxX - minX) + (padding * 2);
        const height = (maxY - minY) + (padding * 2);

        // 2. Clone the DOM element
        const clone = sourceElement.cloneNode(true) as HTMLElement;
        
        // 3. Style the clone to be fixed and invisible to user, but visible to the library
        clone.style.transform = 'none'; // Remove zoom/pan
        clone.style.position = 'fixed'; 
        clone.style.top = '0'; 
        clone.style.left = '0';
        clone.style.zIndex = '-9999';
        clone.style.width = `${width}px`;
        clone.style.height = `${height}px`;
        clone.style.overflow = 'visible'; // Ensure nothing is clipped
        clone.style.backgroundColor = 'transparent';
        
        // 4. Shift all children so they start at coordinate (0 + padding, 0 + padding)
        // This neutralizes the negative coordinates often found in the map generator
        const shiftX = -minX + padding;
        const shiftY = -minY + padding;

        const svg = clone.querySelector('svg');
        if (svg) {
            svg.setAttribute('width', width.toString());
            svg.setAttribute('height', height.toString());
            svg.style.width = `${width}px`;
            svg.style.height = `${height}px`;
            svg.style.overflow = 'visible';
            
            const lines = svg.querySelectorAll('line');
            lines.forEach((line: any) => {
                const x1 = parseFloat(line.getAttribute('x1') || '0');
                const y1 = parseFloat(line.getAttribute('y1') || '0');
                const x2 = parseFloat(line.getAttribute('x2') || '0');
                const y2 = parseFloat(line.getAttribute('y2') || '0');
                
                line.setAttribute('x1', (x1 + shiftX).toString());
                line.setAttribute('y1', (y1 + shiftY).toString());
                line.setAttribute('x2', (x2 + shiftX).toString());
                line.setAttribute('y2', (y2 + shiftY).toString());
            });
        }

        const nodeContainer = clone.children[1] as HTMLElement; 
        if(nodeContainer) {
            Array.from(nodeContainer.children).forEach((child: any) => {
                const currentLeft = parseFloat(child.style.left || '0');
                const currentTop = parseFloat(child.style.top || '0');
                child.style.left = `${currentLeft + shiftX}px`;
                child.style.top = `${currentTop + shiftY}px`;
            });
        }

        return { clone, width, height };
    };

    const handleSaveImage = async (format: 'png' | 'jpg') => {
        setIsSaveMenuOpen(false);
        const sourceElement = document.getElementById('map-content-layer');
        if(!sourceElement || mapNodes.length === 0) return;
        const flatNodes = mapNodes.flat();

        // Prepare the cloned element (unzoomed, full size)
        const { clone, width, height } = prepareClone(sourceElement, flatNodes);
        
        // Append to body temporarily so the library can "see" it to render fonts/styles
        document.body.appendChild(clone);

        try {
            // Wait for fonts to be ready in the document
            await document.fonts.ready;
            
            // Add a small artificial delay to ensure DOM updates (especially font rendering in clone) are propagated
            await new Promise(resolve => setTimeout(resolve, 100));

            const timestamp = new Date().getTime();
            const fileName = `roguelike_map_${timestamp}.${format}`;
            
            // Common options for html-to-image
            const options = {
                quality: 0.95,
                width: width,
                height: height,
                pixelRatio: 2, // Higher resolution
                cacheBust: true, // CRITICAL: Forces fetch of assets (like fonts) bypassing potentially tainted cache
                style: {
                    transform: 'none', 
                    transformOrigin: 'top left'
                },
                // Skip things that might break the render
                skipAutoScale: true
            };

            let dataUrl = '';
            
            if (format === 'png') {
                 dataUrl = await toPng(clone, options);
            } else {
                 // For JPG, we usually want a background color
                 dataUrl = await toJpeg(clone, { ...options, backgroundColor: '#0f172a' });
            }

            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
            
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save map. If icons are missing, try waiting a few seconds after loading.");
        } finally {
            // Clean up the DOM
            document.body.removeChild(clone);
        }
    };

    return (
        <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 z-10 shadow-md">
            <div className="flex items-center gap-2">
                <button onClick={onFitToScreen} className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 text-sm flex items-center gap-2" title={t('fit')}>
                    <i className="fas fa-compress-arrows-alt"></i> <span className="hidden sm:inline">{t('fit')}</span>
                </button>
                <div className="h-6 w-px bg-slate-600 mx-1"></div>
                <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="p-2 w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-slate-200">
                    <i className="fas fa-minus"></i>
                </button>
                <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(Math.min(3, zoom + 0.1))} className="p-2 w-8 h-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-slate-200">
                    <i className="fas fa-plus"></i>
                </button>
            </div>

            <div className="flex items-center gap-3">
                {/* Help Button */}
                <button onClick={onOpenHelp} className="text-yellow-400 hover:text-yellow-200 transition-colors flex items-center gap-1" title={t('help')}>
                     <i className="fas fa-question-circle fa-lg"></i>
                </button>

                <div className="h-6 w-px bg-slate-600 mx-1"></div>

                {/* Language Selector */}
                <div className="relative group h-full flex items-center">
                    <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 uppercase font-bold py-2">
                        <i className="fas fa-globe"></i> {language}
                    </button>
                    <div className="absolute top-full right-0 pt-1 w-24 hidden group-hover:block z-50">
                        <div className="bg-slate-800 border border-slate-600 rounded shadow-xl overflow-hidden">
                            <button onClick={() => setLanguage('en')} className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-700 ${language === 'en' ? 'text-blue-400' : 'text-slate-300'}`}>English</button>
                            <button onClick={() => setLanguage('pt')} className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-700 ${language === 'pt' ? 'text-blue-400' : 'text-slate-300'}`}>Português</button>
                            <button onClick={() => setLanguage('es')} className={`block w-full text-left px-3 py-2 text-xs hover:bg-slate-700 ${language === 'es' ? 'text-blue-400' : 'text-slate-300'}`}>Español</button>
                        </div>
                    </div>
                </div>

                <div className="h-6 w-px bg-slate-600 mx-1"></div>

                 <button onClick={() => fileInputRef.current?.click()} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <i className="fas fa-file-upload"></i> {t('import')}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => e.target.files && onImportJSON(e.target.files[0])} />

                <button onClick={onExportJSON} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <i className="fas fa-file-download"></i> {t('export')}
                </button>
                
                {/* Save As Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsSaveMenuOpen(!isSaveMenuOpen)} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-3 py-1.5 rounded font-medium flex items-center gap-2 ml-2 shadow-lg"
                    >
                        <i className="fas fa-save"></i> {t('saveAs')} <i className="fas fa-chevron-down text-xs"></i>
                    </button>
                    
                    {isSaveMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSaveMenuOpen(false)}></div>
                            <div className="absolute right-0 top-full mt-2 w-32 bg-slate-800 border border-slate-600 rounded shadow-xl z-50 overflow-hidden">
                                <button onClick={() => handleSaveImage('png')} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white">
                                    <i className="fas fa-image w-5"></i> PNG
                                </button>
                                <button onClick={() => handleSaveImage('jpg')} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white">
                                    <i className="fas fa-image w-5"></i> JPG
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
