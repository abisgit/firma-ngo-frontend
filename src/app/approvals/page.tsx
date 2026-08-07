"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { CheckSquare, AlertCircle, Video, ShieldCheck, Award, Loader, Check, CircleDot, Sun, Moon } from 'lucide-react';

export default function ApprovalsPage() {
    const [user, setUser] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(false);

    // Modal state for Biometric Video Consent
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [recordingStep, setRecordingStep] = useState(0); // 0: Init, 1: Recording, 2: Finished

    const router = useRouter();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }

        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const userData = await getMe();
                setUser(userData);

                const docsRes = await api.get('/documents');
                setDocuments(docsRes.data);
            } catch (err) {
                console.error('Error fetching approvals data:', err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const toggleTheme = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    };

    // Actions
    const handleStartSign = (docId: string) => {
        setSelectedDocId(docId);
        setRecordingStep(0);
        setShowVideoModal(true);
    };

    const handleMockRecord = () => {
        setRecordingStep(1);
        setTimeout(() => {
            setRecordingStep(2);
        }, 3000); // Mock a 3-second biometric recording session
    };

    const handleConfirmSign = async () => {
        if (!selectedDocId) return;
        setActioningId(selectedDocId);
        setShowVideoModal(false);

        try {
            await api.post(`/documents/${selectedDocId}/sign`, {
                videoUrl: '/uploads/biometric_consent_officer.mp4' // Mock video URL
            });
            // Reload docs
            const docsRes = await api.get('/documents');
            setDocuments(docsRes.data);
        } catch (err) {
            console.error('Error signing document:', err);
        } finally {
            setActioningId(null);
            setSelectedDocId(null);
        }
    };

    const handleAnchor = async (docId: string) => {
        setActioningId(docId);
        try {
            await api.post(`/documents/${docId}/anchor`);
            // Reload docs
            const docsRes = await api.get('/documents');
            setDocuments(docsRes.data);
        } catch (err) {
            console.error('Error anchoring document:', err);
        } finally {
            setActioningId(null);
        }
    };

    // Filters for lists
    // 1. Pending Signatures (Drafts that need approval by Directors or Managers or Admins)
    const pendingSignatures = documents.filter(d => d.status === 'DRAFT');
    
    // 2. Ready to Anchor (Approved documents that need Global Manager or Admin to anchor)
    const readyToAnchor = documents.filter(d => d.status === 'APPROVED');

    // Permissions check
    const canSign = user?.role === 'COUNTRY_DIRECTOR' || user?.role === 'GLOBAL_MANAGER' || user?.role === 'SUPER_ADMIN';
    const canAnchor = user?.role === 'GLOBAL_MANAGER' || user?.role === 'SUPER_ADMIN';

    if (loading) {
        return (
            <div className={`min-h-screen transition-colors duration-300 flex overflow-hidden ${
                darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}>
                <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} user={user} />
                <div className="flex-1 flex flex-col h-screen items-center justify-center">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm mt-4">Loading verification queue...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 flex overflow-hidden ${
            darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
            {/* Sidebar */}
            <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} user={user} />

            {/* Main Section */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
                {/* Header */}
                <header className={`h-16 px-8 border-b flex items-center justify-between shrink-0 relative z-20 backdrop-blur-md ${
                    darkMode ? 'border-slate-900 bg-slate-900/10' : 'border-slate-200 bg-white/60'
                }`}>
                    <h1 className="text-xl font-bold tracking-tight">Approvals Desk</h1>
                    
                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                            darkMode 
                                ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-950 text-amber-400 hover:text-amber-300' 
                                : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm'
                        }`}
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {darkMode ? <Sun className="h-4 w-4 animate-pulse" /> : <Moon className="h-4 w-4" />}
                    </button>
                </header>

                {/* Viewport */}
                <main className="flex-1 px-8 py-8 relative z-10 space-y-12">
                    {/* SECTION 1: PENDING SIGNATURES */}
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Pending Signatures & Consent</h2>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                                    Verify document intent and capture biometric consent credentials.
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {pendingSignatures.length} pending
                            </span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {pendingSignatures.map((doc) => (
                                <div
                                    key={doc.id}
                                    className={`border rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between ${
                                        darkMode 
                                            ? 'bg-slate-900/40 border-slate-800/85 hover:border-slate-800' 
                                            : 'bg-white border-slate-200 shadow-sm hover:border-slate-350'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                darkMode ? 'text-slate-500' : 'text-slate-400'
                                            }`}>
                                                {doc.documentType?.replace('_', ' ')}
                                            </span>
                                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        </div>

                                        <h3 className={`text-lg font-bold mb-2 truncate ${
                                            darkMode ? 'text-slate-100' : 'text-slate-950'
                                        }`}>
                                            {doc.title}
                                        </h3>

                                        <div className={`space-y-1.5 text-xs mb-6 ${
                                            darkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                            <p>Project: <strong>{doc.project?.name || 'Unassigned'}</strong></p>
                                            <p>Creator: {doc.creator?.firstName} {doc.creator?.lastName} ({doc.creator?.role?.replace('_', ' ')})</p>
                                        </div>
                                    </div>

                                    {/* Action Box */}
                                    <div className="pt-4 border-t border-inherit flex items-center justify-between gap-4">
                                        <span className="text-[11px] italic text-slate-500">Requires Country Director or Manager signature.</span>
                                        {canSign ? (
                                            <button
                                                onClick={() => handleStartSign(doc.id)}
                                                disabled={actioningId === doc.id}
                                                className="py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
                                            >
                                                {actioningId === doc.id ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Video className="h-3.5 w-3.5" />}
                                                Verify & Sign
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-semibold text-rose-500 shrink-0 flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" /> No Signing Access
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {pendingSignatures.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500 text-sm border border-dashed rounded-2xl">
                                    No documents are currently pending signatures.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECTION 2: READY TO ANCHOR */}
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Ready for Blockchain Anchoring</h2>
                                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                                    Seals verified documents into the tamper-proof ledger (Zero-Knowledge hashing).
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                                {readyToAnchor.length} ready
                            </span>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {readyToAnchor.map((doc) => (
                                <div
                                    key={doc.id}
                                    className={`border rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between ${
                                        darkMode 
                                            ? 'bg-slate-900/40 border-slate-800/85 hover:border-slate-800' 
                                            : 'bg-white border-slate-200 shadow-sm hover:border-slate-350'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                darkMode ? 'text-slate-500' : 'text-slate-400'
                                            }`}>
                                                {doc.documentType?.replace('_', ' ')}
                                            </span>
                                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                        </div>

                                        <h3 className={`text-lg font-bold mb-2 truncate ${
                                            darkMode ? 'text-slate-100' : 'text-slate-950'
                                        }`}>
                                            {doc.title}
                                        </h3>

                                        <div className={`space-y-1.5 text-xs mb-6 ${
                                            darkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}>
                                            <p>Project: <strong>{doc.project?.name || 'Unassigned'}</strong></p>
                                            <p>Creator: {doc.creator?.firstName} {doc.creator?.lastName}</p>
                                        </div>
                                    </div>

                                    {/* Action Box */}
                                    <div className="pt-4 border-t border-inherit flex items-center justify-between gap-4">
                                        <span className="text-[11px] italic text-slate-500">Fully signed. Awaiting block hash sealing.</span>
                                        {canAnchor ? (
                                            <button
                                                onClick={() => handleAnchor(doc.id)}
                                                disabled={actioningId === doc.id}
                                                className="py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 text-xs shadow-md transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
                                            >
                                                {actioningId === doc.id ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
                                                Anchor to Ledger
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-semibold text-rose-500 shrink-0 flex items-center gap-1">
                                                <AlertCircle className="h-3.5 w-3.5" /> No Anchoring Access
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {readyToAnchor.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-500 text-sm border border-dashed rounded-2xl">
                                    No documents are currently approved and awaiting anchoring.
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* BIOMETRIC VIDEO CONSENT MODAL */}
            {showVideoModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity">
                    <div className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl ${
                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                        <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                            <Video className="h-5 w-5 text-emerald-500" /> Biometric Verification
                        </h3>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
                            Record video attestation to prove your physical consent for the cryptographic signing key.
                        </p>

                        {/* Video Recording Area Mock */}
                        <div className="w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden mb-6">
                            {recordingStep === 0 && (
                                <div className="text-center p-4">
                                    <CircleDot className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                                    <span className="text-xs text-slate-400 font-semibold block">Camera Feed Ready</span>
                                    <p className="text-[10px] text-slate-600 mt-1 max-w-xs">You will need to read out loud: "I verify the integrity of this audit and consent to sign."</p>
                                </div>
                            )}
                            {recordingStep === 1 && (
                                <div className="text-center p-4 animate-pulse">
                                    <div className="h-3.5 w-3.5 rounded-full bg-rose-500 mx-auto mb-3 animate-ping" />
                                    <span className="text-xs text-rose-500 font-bold block">RECORDING AUDIO/VIDEO FEED</span>
                                    <p className="text-[11px] text-slate-300 mt-2 font-mono italic">"I verify the integrity of this audit and consent..."</p>
                                </div>
                            )}
                            {recordingStep === 2 && (
                                <div className="text-center p-4">
                                    <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                    <span className="text-xs text-emerald-400 font-bold block">Attestation Captured Successfully</span>
                                    <p className="text-[10px] text-slate-500 mt-1">Biometric proof processed and mapped to the verification payload.</p>
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowVideoModal(false)}
                                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold ${
                                    darkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-950 text-slate-300' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                                }`}
                            >
                                Cancel
                            </button>

                            {recordingStep < 2 ? (
                                <button
                                    onClick={handleMockRecord}
                                    disabled={recordingStep === 1}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-red-500 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {recordingStep === 1 ? 'Recording...' : 'Start Recording'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleConfirmSign}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                                >
                                    Confirm & Sign Ledger
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
