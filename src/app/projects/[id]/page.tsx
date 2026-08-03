"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Calendar, DollarSign, ArrowLeft, FileText, CheckCircle2, CloudLightning, Sun, Moon, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [user, setUser] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
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

                if (id) {
                    const projRes = await api.get(`/projects/${id}`);
                    setProject(projRes.data);
                }
            } catch (err) {
                console.error('Error fetching project detail:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router, id]);

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
                    <p className="text-slate-400 text-sm">Loading project details...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
                darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
            }`}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
                    <Link href="/projects" className="text-emerald-500 hover:underline">
                        Return to Projects
                    </Link>
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

            {/* Main Area */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
                {/* Header */}
                <header className={`h-16 px-8 border-b flex items-center justify-between shrink-0 relative z-20 backdrop-blur-md ${
                    darkMode ? 'border-slate-900 bg-slate-900/10' : 'border-slate-200 bg-white/60'
                }`}>
                    <div className="flex items-center gap-4">
                        <Link href="/projects" className={`p-2 rounded-full transition-colors ${
                            darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                        }`}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight">Project Details</h1>
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
                <main className="flex-1 px-8 py-8 relative z-10 max-w-5xl w-full mx-auto">
                    
                    <div className={`mb-8 p-8 rounded-3xl border ${
                        darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                        darkMode 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {project.projectCode}
                                    </span>
                                    {project.isActive && (
                                        <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${
                                            darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            <Activity className="h-3 w-3" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-extrabold tracking-tight mb-2">{project.name}</h2>
                                <p className={`max-w-2xl text-base ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Strategic program focusing on direct impact operations, managing logistics, budgeting, and performance tracking across key regions.
                                </p>
                            </div>
                        </div>

                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-8 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                                    <DollarSign className="h-6 w-6 text-emerald-500" />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Allocated Budget</p>
                                    <p className="text-xl font-bold">${project.budget?.toLocaleString()} USD</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                                    <Calendar className="h-6 w-6 text-indigo-500" />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Project Timeline</p>
                                    <p className="text-xl font-bold">
                                        {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-6">Associated Documents</h3>
                    <div className="space-y-4">
                        {project.documents?.map((doc: any) => (
                            <div key={doc.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                                darkMode 
                                    ? 'bg-slate-900/20 border-slate-800 hover:border-slate-700' 
                                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                            }`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <FileText className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold">{doc.title}</h4>
                                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Type: {doc.documentType} • Created by: {doc.creator?.firstName} {doc.creator?.lastName}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                                    doc.status === 'APPROVED' ? (darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') :
                                    doc.status === 'ANCHORED' ? (darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600') :
                                    (darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')
                                }`}>
                                    {doc.status}
                                </span>
                            </div>
                        ))}

                        {(!project.documents || project.documents.length === 0) && (
                            <div className={`text-center py-12 rounded-2xl border border-dashed ${
                                darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'
                            }`}>
                                No documents associated with this project yet.
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}
