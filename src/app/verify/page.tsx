"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { SearchCheck, Loader, ShieldCheck, ShieldAlert, Award, FileText, CheckCircle, User, Calendar, Anchor, Sun, Moon, ExternalLink, Upload } from 'lucide-react';

export default function VerificationPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Form inputs
    const [hashInput, setHashInput] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
    const [fileInput, setFileInput] = useState<File | null>(null);

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
            } catch (err) {
                console.error('Error fetching verification portal data:', err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hashInput.trim()) return;

        setSearching(true);
        setError('');
        setResult(null);

        try {
            const res = await api.post('/verify', { hash: hashInput });
            setResult(res.data.document);
        } catch (err: any) {
            setError(err.response?.data?.message || 'No matching anchored record found on the ledger.');
        } finally {
            setSearching(false);
        }
    };

    const handleVerifyFile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileInput) return;

        setSearching(true);
        setError('');
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', fileInput);

            const res = await api.post('/verify/file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data.document);
        } catch (err: any) {
            setError(err.response?.data?.message || 'No matching anchored record found on the ledger. The file content might have been modified.');
        } finally {
            setSearching(false);
        }
    };

    const toggleTheme = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Preparing verification tool...</p>
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
                    <h1 className="text-xl font-bold tracking-tight">Ledger Verification Portal</h1>
                    
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
                <main className="flex-1 px-8 py-8 relative z-10 max-w-4xl w-full mx-auto space-y-8">
                    {/* Search Panel */}
                    <div className={`border rounded-2xl p-8 shadow-md backdrop-blur-lg ${
                        darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                    }`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                <SearchCheck className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold">Verify Document Authenticity</h2>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-6`}>
                            Verify standard documents or audit trails on the immutable blockchain ledger.
                        </p>

                        {/* Tab Switcher */}
                        <div className="flex border-b border-inherit mb-6">
                            <button
                                onClick={() => { setActiveTab('text'); setError(''); setResult(null); }}
                                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                                    activeTab === 'text'
                                        ? 'border-emerald-500 text-emerald-500'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Search by Hash / ID / Title
                            </button>
                            <button
                                onClick={() => { setActiveTab('file'); setError(''); setResult(null); }}
                                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all ${
                                    activeTab === 'file'
                                        ? 'border-emerald-500 text-emerald-500'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Scan Accounting Trail File
                            </button>
                        </div>

                        {activeTab === 'text' ? (
                            <form onSubmit={handleVerify} className="flex gap-4">
                                <input
                                    type="text"
                                    value={hashInput}
                                    onChange={(e) => setHashInput(e.target.value)}
                                    className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm ${
                                        darkMode 
                                            ? 'bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-600' 
                                            : 'bg-slate-100/50 border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'
                                    }`}
                                    placeholder="Paste document hash (e.g. 8f497ca839818...) or title"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={searching}
                                    className="py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shrink-0"
                                >
                                    {searching ? <Loader className="h-4 w-4 animate-spin" /> : <SearchCheck className="h-4 w-4" />}
                                    Verify
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyFile} className="space-y-4">
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                    darkMode 
                                        ? 'border-slate-800 bg-slate-950/20 hover:border-slate-700' 
                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                }`}>
                                    <input 
                                        type="file" 
                                        id="verify-file-upload"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setFileInput(e.target.files[0]);
                                            }
                                        }}
                                        className="hidden"
                                        required
                                    />
                                    <label htmlFor="verify-file-upload" className="cursor-pointer">
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="h-10 w-10 text-slate-400 mb-2" />
                                            <span className="text-sm font-semibold block text-emerald-500">
                                                {fileInput ? fileInput.name : "Select accounting file to audit"}
                                            </span>
                                            <span className="text-xs text-slate-500 mt-1">Upload the local file to scan its hash against the ledger</span>
                                        </div>
                                    </label>
                                </div>
                                <button
                                    type="submit"
                                    disabled={searching || !fileInput}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {searching ? <Loader className="h-4 w-4 animate-spin" /> : <SearchCheck className="h-4 w-4" />}
                                    Scan & Audit Document Trail
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Result Panel */}
                    {result && (
                        <div className={`border rounded-2xl p-8 shadow-lg transition-all duration-300 ${
                            darkMode ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                        }`}>
                            {/* Verification Success Header */}
                            <div className="flex items-center gap-3 mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl">
                                <ShieldCheck className="h-6 w-6 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-sm">Ledger Verification Succeeded</h3>
                                    <p className="text-xs text-emerald-400/90 mt-0.5">The document hash matches an authentic anchored record on the ledger.</p>
                                </div>
                            </div>

                            {/* Document Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-4">
                                    <h4 className={`text-xs uppercase font-bold tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Document Specs</h4>
                                    
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start gap-2.5">
                                            <FileText className="h-4 w-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <span className="block text-xs text-slate-500">Title</span>
                                                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{result.title}</span>
                                                {result.fileUrl && (
                                                    <a
                                                        href={result.fileUrl.startsWith('http') ? result.fileUrl : `${api.defaults.baseURL}${result.fileUrl}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 mt-1"
                                                    >
                                                        <ExternalLink className="h-3 w-3" /> Open File
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <CheckCircle className="h-4 w-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <span className="block text-xs text-slate-500">Document Type</span>
                                                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{result.documentType?.replace('_', ' ')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <User className="h-4 w-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <span className="block text-xs text-slate-500">Creator</span>
                                                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{result.creator?.firstName} {result.creator?.lastName}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className={`text-xs uppercase font-bold tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Anchoring Proof</h4>
                                    
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-start gap-2.5">
                                            <Anchor className="h-4 w-4 mt-0.5 text-emerald-500" />
                                            <div className="min-w-0 flex-1">
                                                <span className="block text-xs text-slate-500">SHA-256 Ledger Hash</span>
                                                <span className="font-mono text-xs text-emerald-500 break-all select-all">{result.blockchainHash}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <Anchor className="h-4 w-4 mt-0.5 text-slate-500" />
                                            <div className="min-w-0 flex-1">
                                                <span className="block text-xs text-slate-500">Ledger Transaction ID</span>
                                                <span className={`font-mono text-xs break-all select-all ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{result.txId}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <Calendar className="h-4 w-4 mt-0.5 text-slate-500" />
                                            <div>
                                                <span className="block text-xs text-slate-500">Sealed Date / Timestamp</span>
                                                <span className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{new Date(result.updatedAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Signatures Log */}
                            <div className="border-t border-inherit pt-6">
                                <h4 className={`text-xs uppercase font-bold tracking-wider mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Digital Signatures & Video-Consent Audit Logs</h4>
                                <div className="space-y-4">
                                    {result.signatures?.map((sig: any) => (
                                        <div key={sig.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                            darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                                        }`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                                        {sig.signer?.firstName} {sig.signer?.lastName}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                                                        darkMode ? 'bg-slate-900 text-slate-400 border border-slate-800' : 'bg-white text-slate-500 border border-slate-200'
                                                    }`}>
                                                        {sig.signer?.role?.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-1 select-all font-mono">Signer Signature Hash: {sig.signatureHash}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] text-slate-500">Sign Time</span>
                                                <span className={`text-xs font-medium ${darkMode ? 'text-slate-350' : 'text-slate-700'}`}>
                                                    {new Date(sig.signedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!result.signatures || result.signatures.length === 0) && (
                                        <p className="text-xs italic text-slate-500">No cryptographic signature records found on this document.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error / Not Found */}
                    {error && (
                        <div className={`border rounded-2xl p-6 shadow-md flex items-center gap-3 transition-all bg-rose-500/10 border-rose-500/20 text-rose-500`}>
                            <ShieldAlert className="h-6 w-6 shrink-0" />
                            <div>
                                <h3 className="font-bold text-sm">Ledger Verification Failed</h3>
                                <p className="text-xs mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
