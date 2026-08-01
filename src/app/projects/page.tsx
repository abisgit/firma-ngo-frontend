"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Calendar, DollarSign, Award, Folder, Sun, Moon } from 'lucide-react';

export default function ProjectsPage() {
    const [user, setUser] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        projectCode: '',
        budget: '',
        startDate: '',
        endDate: ''
    });
    const router = useRouter();

    const fetchProjects = async () => {
        try {
            const projRes = await api.get('/projects');
            setProjects(projRes.data);
        } catch (err) {
            console.error('Error fetching projects:', err);
        }
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

                const projRes = await api.get('/projects');
                setProjects(projRes.data);
            } catch (err) {
                console.error('Error fetching initial data:', err);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await api.post('/projects', newProject);
            setShowCreateModal(false);
            setNewProject({ name: '', projectCode: '', budget: '', startDate: '', endDate: '' });
            await fetchProjects();
        } catch (err) {
            console.error('Failed to create project:', err);
            alert('Failed to create project. Please check the inputs or try again.');
        } finally {
            setCreating(false);
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
                    <p className="text-slate-400 text-sm">Loading projects data...</p>
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
                    <h1 className="text-xl font-bold tracking-tight">NGO Projects</h1>
                    
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
                <main className="flex-1 px-8 py-8 relative z-10">
                    <div className="mb-6 flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Active Portfolios</h2>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-1`}>
                                Track active programs, operational budgets, and cross-border project logistics.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
                        >
                            + Create Project
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={`border rounded-2xl p-6 transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                                    darkMode 
                                        ? 'bg-slate-900/40 border-slate-800/85 hover:border-slate-700/80' 
                                        : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    {/* Project Code & Icon */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                                            darkMode 
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                            {project.projectCode}
                                        </span>
                                        <div className={`p-2 rounded-xl ${
                                            darkMode ? 'bg-slate-950/60 text-slate-400' : 'bg-slate-50 text-slate-500'
                                        }`}>
                                            <Folder className="h-5 w-5" />
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <h3 className={`text-lg font-bold leading-snug mb-4 ${
                                        darkMode ? 'text-slate-100' : 'text-slate-950'
                                    }`}>
                                        {project.name}
                                    </h3>
                                </div>

                                {/* Details */}
                                <div className={`space-y-3 pt-4 border-t text-sm ${
                                    darkMode ? 'border-slate-800/80 text-slate-400' : 'border-slate-100 text-slate-600'
                                }`}>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 shrink-0 text-emerald-500" />
                                        <span>Budget: <strong>${project.budget?.toLocaleString()} USD</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
                                        <span>
                                            Timeline: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {projects.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
                                No active projects registered in this tenant organization.
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
                        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Create New Project</h2>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Project Name</label>
                                <input 
                                    type="text" required
                                    value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Project Code</label>
                                <input 
                                    type="text" required
                                    value={newProject.projectCode} onChange={e => setNewProject({...newProject, projectCode: e.target.value})}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300'
                                    }`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Budget (USD)</label>
                                <input 
                                    type="number"
                                    value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                                        darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300'
                                    }`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Start Date</label>
                                    <input 
                                        type="date"
                                        value={newProject.startDate} onChange={e => setNewProject({...newProject, startDate: e.target.value})}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                                            darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>End Date</label>
                                    <input 
                                        type="date"
                                        value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none ${
                                            darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300'
                                        }`}
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
