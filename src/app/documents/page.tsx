"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import SignatureModal from '@/components/SignatureModal';
import { FileText, Plus, Filter, CheckCircle, Clock, ShieldAlert, Award, Sun, Moon, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function DocumentsPage() {
    const [user, setUser] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [filteredDocs, setFilteredDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [firmaConnected, setFirmaConnected] = useState<boolean>(true);
    const [darkMode, setDarkMode] = useState(false);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [signatureDocumentId, setSignatureDocumentId] = useState('');

    // Filters
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [typeFilter, setTypeFilter] = useState('ALL');

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
                setFilteredDocs(docsRes.data);

                // Check FIRMA Core connection
                try {
                    const connRes = await api.get('/firma/connection-status');
                    setFirmaConnected(connRes.data.connected);
                } catch (e) {
                    setFirmaConnected(false);
                }
            } catch (err) {
                console.error('Error fetching documents:', err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    // Apply filters
    useEffect(() => {
        let results = [...documents];
        if (statusFilter !== 'ALL') {
            results = results.filter((doc) => doc.status === statusFilter);
        }
        if (typeFilter !== 'ALL') {
            results = results.filter((doc) => doc.documentType === typeFilter);
        }
        setFilteredDocs(results);
    }, [statusFilter, typeFilter, documents]);

    const toggleTheme = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    };

    const getStatusBadge = (status: string) => {
        const base = "px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 w-fit ";
        switch (status) {
            case 'DRAFT':
                return <span className={base + (darkMode ? "bg-slate-800 text-slate-400 border border-slate-700/50" : "bg-slate-100 text-slate-600 border border-slate-200")}><Clock className="h-3 w-3" /> Draft</span>;
            case 'PENDING_SIGNATURES':
                return <span className={base + (darkMode ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-amber-50 text-amber-700 border border-amber-100")}><Clock className="h-3 w-3" /> Pending Signature</span>;
            case 'APPROVED':
                return <span className={base + (darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-700 border border-blue-100")}><CheckCircle className="h-3 w-3" /> Approved</span>;
            case 'ANCHORED':
                return <span className={base + (darkMode ? "bg-primary-500/10 text-primary-400 border border-primary-500/20" : "bg-primary-50 text-primary-700 border-primary-100")}><Award className="h-3 w-3" /> Anchored</span>;
            default:
                return <span className={base + "bg-slate-100 text-slate-600"}>{status}</span>;
        }
    };

    const handleSign = (id: string) => {
        setSignatureDocumentId(id);
        setSignatureModalOpen(true);
    };

    const handleViewDocument = (e: React.MouseEvent, fileUrl: string) => {
        e.preventDefault();
        if (fileUrl.startsWith('data:')) {
            try {
                const parts = fileUrl.split(';base64,');
                const contentType = parts[0].split(':')[1];
                const raw = window.atob(parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                    uInt8Array[i] = raw.charCodeAt(i);
                }
                const blob = new Blob([uInt8Array], { type: contentType });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            } catch (err) {
                console.error('Error opening base64 document:', err);
                alert('Could not open the document.');
            }
        } else {
            const baseUrl = api.defaults.baseURL || 'http://localhost:3004';
            const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;
            window.open(fullUrl, '_blank');
        }
    };

    const fetchDocuments = useCallback(async () => {
        try {
            const docsRes = await api.get('/documents');
            setDocuments(docsRes.data);
            let results = [...docsRes.data];
            if (statusFilter !== 'ALL') results = results.filter((doc: any) => doc.status === statusFilter);
            if (typeFilter !== 'ALL') results = results.filter((doc: any) => doc.documentType === typeFilter);
            setFilteredDocs(results);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        }
    }, []);

    const handleAnchor = async (id: string) => {
        try {
            await api.post(`/documents/${id}/anchor`);
            const docsRes = await api.get('/documents');
            setDocuments(docsRes.data);
            let results = [...docsRes.data];
            if (statusFilter !== 'ALL') results = results.filter((doc: any) => doc.status === statusFilter);
            if (typeFilter !== 'ALL') results = results.filter((doc: any) => doc.documentType === typeFilter);
            setFilteredDocs(results);
            alert('Document anchored on blockchain!');
        } catch (err) {
            console.error(err);
            alert('Error anchoring document');
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 flex overflow-hidden ${
            darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
            {/* Sidebar */}
            <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} user={user} />

            {/* Main Section */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
                
                <SignatureModal 
                    isOpen={signatureModalOpen} 
                    onClose={() => setSignatureModalOpen(false)} 
                    onSuccess={fetchDocuments}
                    documentId={signatureDocumentId}
                    darkMode={darkMode}
                />

                {/* Header */}
                <header className={`h-16 px-8 border-b flex items-center justify-between shrink-0 relative z-20 backdrop-blur-md ${
                    darkMode ? 'border-slate-900 bg-slate-900/10' : 'border-slate-200 bg-white/60'
                }`}>
                    <h1 className="text-xl font-bold tracking-tight">Documents History</h1>
                    
                    <div className="flex items-center gap-4">
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

                        {/* Add Document button (Visible to Field Officers & admins) */}
                        {(user?.role === 'FIELD_OFFICER' || user?.role === 'SUPER_ADMIN') && (
                            <Link
                                href="/documents/create"
                                className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-primary-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-primary-400 hover:to-teal-400 text-xs shadow-md transition-all active:scale-95"
                            >
                                <Plus className="h-4 w-4" /> Create Document
                            </Link>
                        )}
                    </div>
                </header>

                {/* Viewport */}
                <main className="flex-1 px-8 py-8 relative z-10">
                    {/* Filters Toolbar */}
                    <div className={`border rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center ${
                        darkMode ? 'bg-slate-900/30 border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Filter className="h-4 w-4 text-primary-500" />
                            <span>Filters:</span>
                        </div>

                        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
                            {/* Document Type */}
                            <div className="flex flex-col gap-1 flex-1 sm:flex-initial">
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Doc Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold focus:outline-none border ${
                                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <option value="ALL">All Types</option>
                                    <option value="GRANT_PROPOSAL">Grant Proposal</option>
                                    <option value="AUDIT_REPORT">Audit Report</option>
                                    <option value="MOU">MOU</option>
                                    <option value="BENEFICIARY_CONSENT">Beneficiary Consent</option>
                                    <option value="FINANCIAL_REPORT">Financial Report</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col gap-1 flex-1 sm:flex-initial">
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold focus:outline-none border ${
                                        darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="PENDING_SIGNATURES">Pending Signature</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="ANCHORED">Anchored</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Document Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredDocs.map((doc) => (
                            <div
                                key={doc.id}
                                className={`border rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between ${
                                    darkMode 
                                        ? 'bg-slate-900/40 border-slate-800/85 hover:border-slate-800' 
                                        : 'bg-white border-slate-200 shadow-sm hover:border-slate-350'
                                }`}
                            >
                                <div>
                                    {/* Type & Status */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                                            darkMode ? 'text-slate-500' : 'text-slate-400'
                                        }`}>
                                            {doc.documentType?.replace('_', ' ')}
                                        </span>
                                        {getStatusBadge(doc.status)}
                                    </div>

                                    {/* Title */}
                                    <h3 className={`text-lg font-bold mb-2 truncate ${
                                        darkMode ? 'text-slate-100' : 'text-slate-950'
                                    }`}>
                                        {doc.title}
                                    </h3>

                                    {/* Creator & Project Info */}
                                    <div className={`space-y-1.5 text-xs mb-4 ${
                                        darkMode ? 'text-slate-400' : 'text-slate-600'
                                    }`}>
                                        <p>Project: <strong className={darkMode ? 'text-slate-200' : 'text-slate-800'}>{doc.project?.name || 'Unassigned'}</strong></p>
                                        <p>Creator: {doc.creator?.firstName} {doc.creator?.lastName} ({doc.creator?.role?.replace('_', ' ')})</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {doc.fileUrl && (
                                            <button
                                                onClick={(e) => handleViewDocument(e, doc.fileUrl)}
                                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border rounded-lg transition-all ${
                                                    darkMode
                                                        ? 'bg-slate-950/40 border-slate-800 text-primary-400 hover:bg-slate-900 hover:text-primary-300'
                                                        : 'bg-slate-50 border-slate-200 text-primary-600 hover:bg-slate-100 hover:text-primary-700'
                                                }`}
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" /> View Document File
                                            </button>
                                        )}
                                        
                                        {doc.status === 'DRAFT' && (
                                            <button
                                                onClick={() => handleSign(doc.id)}
                                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border rounded-lg transition-all ${
                                                    darkMode
                                                        ? 'bg-blue-950/40 border-blue-800 text-blue-400 hover:bg-blue-900 hover:text-blue-300'
                                                        : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                                                }`}
                                            >
                                                <CheckCircle className="h-3.5 w-3.5" /> Sign Document
                                            </button>
                                        )}

                                        {doc.status === 'APPROVED' && firmaConnected && (
                                            <button
                                                onClick={() => handleAnchor(doc.id)}
                                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition-all shadow-sm ${
                                                    darkMode
                                                        ? 'bg-primary-600 text-white hover:bg-primary-500'
                                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                                }`}
                                            >
                                                <Award className="h-3.5 w-3.5" /> Anchor Document
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Cryptographic Proof Log */}
                                <div className={`pt-4 border-t text-xs space-y-2 ${
                                    darkMode ? 'border-slate-800/85 text-slate-500' : 'border-slate-100 text-slate-500'
                                }`}>
                                    {doc.blockchainHash ? (
                                        <div className="flex flex-row gap-4">
                                            <div className="shrink-0 p-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                <QRCodeSVG 
                                                    value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3005'}/verify?hash=${doc.blockchainHash}`} 
                                                    size={64} 
                                                    bgColor={"#ffffff"}
                                                    fgColor={"#000000"}
                                                    level={"M"}
                                                />
                                            </div>
                                            <div className="space-y-1 overflow-hidden flex flex-col justify-center">
                                                <span className="block font-semibold uppercase tracking-wider text-[9px] text-primary-500">Blockchain Ledger Proof</span>
                                                <p className="font-mono truncate select-all">Hash: {doc.blockchainHash}</p>
                                                <p className="font-mono truncate select-all">TxID: {doc.txId}</p>
                                            </div>
                                        </div>
                                    ) : !firmaConnected ? (
                                        <div className={`flex items-center gap-2 p-2 rounded border ${darkMode ? 'bg-red-950/20 border-red-900 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                            <ShieldAlert className="h-4 w-4 shrink-0" />
                                            <span className="font-semibold text-[11px]">FIRMA Core is disconnected. Anchoring unavailable.</span>
                                        </div>
                                    ) : (
                                        <p className="italic">No blockchain anchoring proof generated yet.</p>
                                    )}

                                    {/* Signature count */}
                                    <div className="pt-2 flex items-center justify-between">
                                        <span>Signatures: {doc.signatures?.length || 0} applied</span>
                                        {doc.signatures?.length > 0 && (
                                            <span className={`text-[10px] font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                Signed by {doc.signatures[0]?.signer?.firstName} {doc.signatures[0]?.signer?.lastName} ({doc.signatures[0]?.signer?.role?.replace('_', ' ')})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredDocs.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-500 text-sm border border-dashed rounded-2xl">
                                <FileText className="h-8 w-8 mx-auto text-slate-400 mb-2 opacity-50" />
                                No documents match the selected filters.
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
