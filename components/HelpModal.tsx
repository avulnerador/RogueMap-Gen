

import React from 'react';

interface Props {
    onClose: () => void;
    t: (key: string) => string;
}

export const HelpModal: React.FC<Props> = ({ onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl border border-slate-600 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-lg">
                    <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <i className="fas fa-book-open"></i> {t('helpTitle')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-slate-200">
                    
                    {/* Controls Table */}
                    <div>
                        <h3 className="text-lg font-bold text-blue-400 mb-4 border-b border-slate-700 pb-2">
                            <i className="fas fa-gamepad mr-2"></i>{t('helpControlsTitle')}
                        </h3>
                        <div className="bg-slate-900 rounded border border-slate-700 overflow-hidden">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-3 font-bold text-white w-1/3 bg-slate-800/50">{t('ctrlMoveNode')}</td>
                                        <td className="p-3 text-slate-300"><i className="fas fa-hand-pointer mr-2 text-blue-400"></i> {t('ctrlMoveNodeDesc')}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-3 font-bold text-white bg-slate-800/50">{t('ctrlEditNode')}</td>
                                        <td className="p-3 text-slate-300"><i className="fas fa-mouse-pointer mr-2 text-yellow-400"></i> {t('ctrlEditNodeDesc')}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-3 font-bold text-white bg-slate-800/50">{t('ctrlPanMap')}</td>
                                        <td className="p-3 text-slate-300"><i className="fas fa-arrows-alt mr-2 text-slate-400"></i> {t('ctrlPanMapDesc')}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 font-bold text-white bg-slate-800/50">{t('ctrlZoom')}</td>
                                        <td className="p-3 text-slate-300"><i className="fas fa-search-plus mr-2 text-slate-400"></i> {t('ctrlZoomDesc')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div>
                        <h3 className="text-lg font-bold text-emerald-400 mb-4 border-b border-slate-700 pb-2">
                            <i className="fas fa-lightbulb mr-2"></i>{t('helpWorkflowTitle')}
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Feature 1 */}
                            <div className="bg-slate-700/30 p-4 rounded border border-slate-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <i className="fas fa-sync text-blue-400"></i> {t('featGenTitle')}
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {t('featGenDesc')}
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-slate-700/30 p-4 rounded border border-slate-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <i className="fas fa-lock text-red-400"></i> {t('featLockTitle')}
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {t('featLockDesc')}
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-slate-700/30 p-4 rounded border border-slate-700 col-span-1 md:col-span-2">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                                    <i className="fas fa-random text-purple-400"></i> {t('featChaosTitle')}
                                </h4>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    {t('featChaosDesc')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-900/50 flex items-center gap-3">
                        <i className="fab fa-font-awesome text-2xl text-blue-400 ml-2"></i>
                        <p className="text-sm text-slate-300">
                            {t('iconTip')} <a href="https://fontawesome.com/search?o=r&m=free" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline font-bold">fontawesome.com</a>
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-end rounded-b-lg">
                    <button onClick={onClose} className="px-8 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded shadow-lg transition-transform active:scale-95">
                        {t('done')}
                    </button>
                </div>
            </div>
        </div>
    );
};