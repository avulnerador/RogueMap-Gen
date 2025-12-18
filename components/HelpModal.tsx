import React from 'react';

interface Props {
    onClose: () => void;
    t: (key: string) => string;
}

export const HelpModal: React.FC<Props> = ({ onClose, t }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg border border-slate-600 flex flex-col animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-lg">
                    <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                        <i className="fas fa-book-open"></i> {t('helpTitle')}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 text-slate-200">
                    
                    {/* Navigation Section */}
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-blue-900/50 rounded flex items-center justify-center shrink-0 border border-blue-700 text-blue-300">
                            <i className="fas fa-arrows-alt fa-lg"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 text-white">{t('navTitle')}</h3>
                            <ul className="text-sm space-y-1 text-slate-300">
                                <li><i className="fas fa-mouse-pointer w-5 text-center"></i> {t('navDrag')}</li>
                                <li><i className="fas fa-search-plus w-5 text-center"></i> {t('navZoom')}</li>
                                <li><i className="fas fa-compress w-5 text-center"></i> {t('navFit')}</li>
                            </ul>
                        </div>
                    </div>

                    <hr className="border-slate-700" />

                    {/* Editing Section */}
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-emerald-900/50 rounded flex items-center justify-center shrink-0 border border-emerald-700 text-emerald-300">
                            <i className="fas fa-edit fa-lg"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 text-white">{t('editTitle')}</h3>
                            <p className="text-sm text-slate-300 mb-2">{t('editClick')}</p>
                            <p className="text-sm text-slate-400 italic mb-2"><i className="fas fa-lock text-xs"></i> {t('editLock')}</p>
                            <p className="text-sm text-slate-300">
                                {t('iconTip')} <a href="https://fontawesome.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">fontawesome.com</a>
                            </p>
                        </div>
                    </div>

                    <hr className="border-slate-700" />

                    {/* Generation Section */}
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-purple-900/50 rounded flex items-center justify-center shrink-0 border border-purple-700 text-purple-300">
                            <i className="fas fa-magic fa-lg"></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-1 text-white">{t('genTitle')}</h3>
                            <p className="text-sm text-slate-300">{t('genDesc')}</p>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-end rounded-b-lg">
                    <button onClick={onClose} className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded shadow-lg">
                        {t('done')}
                    </button>
                </div>
            </div>
        </div>
    );
};