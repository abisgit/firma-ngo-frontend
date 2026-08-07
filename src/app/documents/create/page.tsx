"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, FileText, Send, Sun, Moon, Upload } from 'lucide-react';
import Link from 'next/link';

export default function CreateDocumentPage() {
    const [user, setUser] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [darkMode, setDarkMode] = useState(false);

    // Form inputs
    const [title, setTitle] = useState('');
    const [documentType, setDocumentType] = useState('GRANT_PROPOSAL');
    const [projectId, setProjectId] = useState('');
    const [error, setError] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (projects.length > 0 && !projectId) {
            setProjectId(projects[0].id);
        }
    }, [projects, projectId]);

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
                // Ensure only creators can create documents
                if (userData.role !== 'FIELD_OFFICER' && userData.role !== 'SUPER_ADMIN') {
                    router.push('/documents');
                    return;
                }
                setUser(userData);

                const projRes = await api.get('/projects');
                setProjects(projRes.data);
                if (projRes.data.length > 0) {
                    setProjectId(projRes.data[0].id);
                }
            } catch (err) {
                console.error('Error loading create document resources:', err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Document Title is required.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            let uploadedFileUrl = '/uploads/sample_proposal.pdf';

            // If a file is selected, convert to base64
            if (file) {
                uploadedFileUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.onerror = (e) => reject(e);
                    reader.readAsDataURL(file);
                });
            }

            await api.post('/documents', {
                title,
                documentType,
                projectId: projectId || null,
                fileUrl: uploadedFileUrl
            });
            router.push('/documents');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create document draft.');
        } finally {
            setSubmitting(false);
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
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm">Preparing workspace...</p>
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
                    <div className="flex items-center gap-4">
                        <Link
                            href="/documents"
                            className={`p-2 rounded-xl transition-all ${
                                darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight">Create Document Draft</h1>
                    </div>

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
                <main className="flex-1 px-8 py-8 relative z-10 max-w-3xl w-full mx-auto">
                    <div className={`border rounded-2xl p-8 shadow-md backdrop-blur-lg ${
                        darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                    }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-primary-500/10 text-primary-400' : 'bg-primary-100 text-primary-700'}`}>
                                <FileText className="h-5 w-5" />
                            </div>
                            <h2 className="text-xl font-bold">Document Details</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            {/* Document Title */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Document Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm ${
                                        darkMode 
                                            ? 'bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-600' 
                                            : 'bg-slate-100/50 border-slate-200 text-slate-900 placeholder-slate-400'
                                    }`}
                                    placeholder="e.g. Q2 Operational Audit Report"
                                    required
                                />
                            </div>

                            {/* Document Type */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Document Type</label>
                                <select
                                    value={documentType}
                                    onChange={(e) => setDocumentType(e.target.value)}
                                    className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm ${
                                        darkMode 
                                            ? 'bg-slate-950/50 border-slate-800 text-slate-100' 
                                            : 'bg-slate-100/50 border-slate-200 text-slate-900'
                                    }`}
                                >
                                    <option value="GRANT_PROPOSAL">Grant Proposal</option>
                                    <option value="AUDIT_REPORT">Audit Report</option>
                                    <option value="MOU">MOU</option>
                                    <option value="BENEFICIARY_CONSENT">Beneficiary Consent</option>
                                    <option value="FINANCIAL_REPORT">Financial Report</option>
                                </select>
                            </div>

                            {/* Project Assignment */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Assign Project Portfolio</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className={`block w-full px-4 py-3 border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm ${
                                        darkMode 
                                            ? 'bg-slate-950/50 border-slate-800 text-slate-100' 
                                            : 'bg-slate-100/50 border-slate-200 text-slate-900'
                                    }`}
                                >
                                    {projects.map((proj) => (
                                        <option key={proj.id} value={proj.id}>
                                            {proj.name} ({proj.projectCode})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* File Upload Option */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Upload Document File</label>
                                <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                    darkMode 
                                        ? 'border-slate-800 bg-slate-950/20 hover:border-slate-700' 
                                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                                }`}>
                                    <input 
                                        type="file" 
                                        id="file-upload"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer">
                                        <div className="flex flex-col items-center justify-center">
                                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                            <span className="text-sm font-semibold block text-primary-500">
                                                {file ? file.name : "Click to select a file"}
                                            </span>
                                            <span className="text-xs text-slate-500 mt-1">Supports PDF, DOC, XLS up to 10MB</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-primary-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-lg shadow-primary-500/10 text-sm"
                            >
                                {submitting ? 'Creating draft...' : 'Create Draft'}
                                {!submitting && <Send className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
}
