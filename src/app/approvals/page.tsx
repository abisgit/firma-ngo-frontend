"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import SignatureModal from '@/components/SignatureModal';
import { CheckSquare, AlertCircle, Video, ShieldCheck, Award, Loader, Check, CircleDot, Sun, Moon, CheckCircle } from 'lucide-react';

export default function ApprovalsPage() {
    const [user, setUser] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState<string | null>(null);
    const [darkMode, setDarkMode] = useState(false);

    // Signature Modal state
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const router = useRouter();

    const sortDocuments = (docs: any[]) => {
        return [...docs].sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
        });
    };

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
                setDocuments(sortDocuments(docsRes.data));
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
        setSignatureModalOpen(true);
    };

    const handleSignSuccess = async () => {
        try {
            const docsRes = await api.get('/documents');
            setDocuments(sortDocuments(docsRes.data));
        } catch (err) {
            console.error('Failed to reload documents after signing:', err);
        } finally {
            setSelectedDocId(null);
        }
    };

    const handleAnchor = async (docId: string) => {
        setActioningId(docId);
        try {
            await api.post(`/documents/${docId}/anchor`);
            // Reload docs
            const docsRes = await api.get('/documents');
            setDocuments(sortDocuments(docsRes.data));
        } catch (err) {
            console.error('Error anchoring document:', err);
        } finally {
            setActioningId(null);
        }
    };

    // Filters for lists (sorted latest first so new drafts, freshly signed, and newly anchored docs appear at the top)
    const sortedDocs = sortDocuments(documents);
    // 1. Pending Signatures (Drafts and Pending documents that need approval by Directors or Managers or Admins)
    const pendingSignatures = sortedDocs.filter(d => d.status === 'DRAFT' || d.status === 'PENDING_SIGNATURES');
    
    // 2. Ready to Anchor (Approved documents that need Global Manager or Admin to anchor)
    const readyToAnchor = sortedDocs.filter(d => d.status === 'APPROVED');

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
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
                                                className="py-2 px-4 bg-white text-slate-900 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
                                            >
                                                {actioningId === doc.id ? <Loader className="h-3.5 w-3.5 animate-spin text-slate-700" /> : <CheckCircle className="h-3.5 w-3.5 text-slate-700" />}
                                                Apply Signature
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
                                                className="py-2 px-4 bg-white text-slate-900 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-xs shadow-sm transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shrink-0"
                                            >
                                                {actioningId === doc.id ? <Loader className="h-3.5 w-3.5 animate-spin text-slate-700" /> : <Award className="h-3.5 w-3.5 text-slate-700" />}
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

            {/* SIGNATURE MODAL */}
            <SignatureModal 
                isOpen={signatureModalOpen} 
                onClose={() => {
                    setSignatureModalOpen(false);
                    setSelectedDocId(null);
                }} 
                onSuccess={handleSignSuccess}
                documentId={selectedDocId || ''}
                darkMode={darkMode}
            />
        </div>
    );
}
