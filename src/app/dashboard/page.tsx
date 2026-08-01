"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { Shield, Award, User, Building, MapPin, Briefcase, FileText, CheckCircle2, CloudLightning, Sun, Moon } from 'lucide-react';

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false); // Default to light mode (false)
    const [stats, setStats] = useState({ projects: 0, documents: 0, pending: 0, anchored: 0 });
    const router = useRouter();

    useEffect(() => {
        setDarkMode(false);
        localStorage.setItem('theme', 'light');

        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                // Fetch User
                const userData = await getMe();
                setUser(userData);

                // Fetch documents & projects to compute stats
                const [docsRes, projectsRes] = await Promise.all([
                    api.get('/documents'),
                    api.get('/projects')
                ]);

                const docs = docsRes.data;
                const projs = projectsRes.data;

                setStats({
                    projects: projs.length,
                    documents: docs.length,
                    pending: docs.filter((d: any) => d.status === 'DRAFT' || d.status === 'PENDING_SIGNATURES').length,
                    anchored: docs.filter((d: any) => d.status === 'ANCHORED').length
                });

            } catch (err) {
                console.error('Failed to authenticate token:', err);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

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
                    <p className={`text-sm animate-pulse ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Loading secure environment...
                    </p>
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
                {/* Ambient lights */}
                <div className={`absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-500 ${
                    darkMode ? 'bg-emerald-500/5 opacity-100' : 'bg-emerald-500/10 opacity-60'
                }`} />

                {/* Dashboard Header */}
                <header className={`h-16 px-8 border-b flex items-center justify-between shrink-0 relative z-20 backdrop-blur-md ${
                    darkMode ? 'border-slate-900 bg-slate-900/10' : 'border-slate-200 bg-white/60'
                }`}>
                    <h1 className="text-xl font-bold tracking-tight">Coordinator Dashboard</h1>
                    
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

                        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors cursor-default select-none ${
                            darkMode 
                                ? 'bg-slate-900 border-slate-800 text-slate-300' 
                                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                        }`}>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Connected
                        </div>
                    </div>
                </header>

                {/* Dashboard Viewport */}
                <main className="flex-1 px-8 py-8 relative z-10">
                    {/* Welcome Banner */}
                    <div className={`border transition-all duration-300 rounded-2xl p-8 mb-8 relative overflow-hidden bg-gradient-to-r ${
                        darkMode 
                            ? 'from-emerald-950/20 to-teal-950/20 border-emerald-900/20' 
                            : 'from-emerald-50 to-teal-50 border-emerald-100'
                    }`}>
                        <div className="absolute -right-10 -bottom-10 opacity-[0.03] pointer-events-none">
                            <Shield className={`w-64 h-64 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div className="max-w-3xl">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
                                darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {user?.role?.replace('_', ' ')}
                            </span>
                            <h2 className={`text-4xl font-bold tracking-tight mt-4 mb-3 transition-colors ${
                                darkMode ? 'text-slate-50' : 'text-slate-900'
                            }`}>
                                Welcome back, {user?.firstName} {user?.lastName}!
                            </h2>
                            <p className={`leading-relaxed transition-colors ${
                                darkMode ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                                Your identity has been authenticated successfully via the FIRMA Trust Engine. You have access to secure document routing, digital signatures, and biometric consent services.
                            </p>
                        </div>
                    </div>

                    {/* Stats Metrics Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {[
                            { name: 'Active Projects', value: stats.projects, icon: Briefcase, color: 'emerald' },
                            { name: 'Total Documents', value: stats.documents, icon: FileText, color: 'blue' },
                            { name: 'Pending Approvals', value: stats.pending, icon: CheckCircle2, color: 'amber' },
                            { name: 'Anchored on Ledger', value: stats.anchored, icon: CloudLightning, color: 'teal' }
                        ].map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div key={i} className={`border rounded-2xl p-6 transition-all duration-200 ${
                                    darkMode 
                                        ? 'bg-slate-900/40 border-slate-800/85' 
                                        : 'bg-white border-slate-200 shadow-sm'
                                }`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.name}</span>
                                        <div className={`p-2 rounded-xl ${
                                            darkMode 
                                                ? 'bg-slate-950/60 text-emerald-400' 
                                                : 'bg-slate-50 text-emerald-600 border border-slate-100'
                                        }`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className={`text-3xl font-extrabold tracking-tight ${
                                        darkMode ? 'text-slate-5' : 'text-slate-900'
                                    }`}>
                                        {stat.value}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Profile details */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className={`border rounded-xl p-6 backdrop-blur-sm transition-all ${
                            darkMode 
                                ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' 
                                : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <User className="h-5 w-5" />
                                </div>
                                <h3 className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-850'}`}>Account Details</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className={`block text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Email Address</span>
                                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.email}</span>
                                </div>
                                <div>
                                    <span className={`block text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>User ID</span>
                                    <span className={`font-mono text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.id}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`border rounded-xl p-6 backdrop-blur-sm transition-all ${
                            darkMode 
                                ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' 
                                : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-teal-500/10 text-teal-400' : 'bg-teal-100 text-teal-700'}`}>
                                    <Building className="h-5 w-5" />
                                </div>
                                <h3 className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-850'}`}>Organization</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className={`block text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Organization Name</span>
                                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.organization?.name || 'Not Available'}</span>
                                </div>
                                <div>
                                    <span className={`block text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Registration Code</span>
                                    <span className={`font-mono text-xs ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.organization?.registrationCode || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className={`border rounded-xl p-6 backdrop-blur-sm transition-all ${
                            darkMode 
                                ? 'bg-slate-900/40 border-slate-800/80 text-slate-400' 
                                : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                        }`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <h3 className={`font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-850'}`}>Location</h3>
                            </div>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className={`block text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Country of Operations</span>
                                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{user?.organization?.country || 'Global'}</span>
                                </div>
                                <div>
                                    <span className={`block text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Identity Provider</span>
                                    <span className={`font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>FIRMA Identity API</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integration Notice */}
                    <div className={`mt-8 border rounded-xl p-6 text-center transition-all ${
                        darkMode ? 'bg-slate-900/20 border-slate-800/50' : 'bg-slate-100/50 border-slate-200'
                    }`}>
                        <Award className={`h-8 w-8 mx-auto mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <h4 className={`font-semibold mb-1 ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>FIRMA Trust Infrastructure Active</h4>
                        <p className={`text-xs max-w-md mx-auto ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            All signatures and attestation workflows in this application are securely hashed and anchored to the core cryptographic ledger.
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
}
