'use client';

import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Globe, Calendar, CheckCircle, Moon, Sun, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api, { getMe } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function OrganizationProfilePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [darkMode, setDarkMode] = useState(false);
    const [organization, setOrganization] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') setDarkMode(true);

        const init = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }
            try {
                const userData = await getMe();
                setCurrentUser(userData);
                if (userData.role !== 'SYSTEM_ADMIN' && userData.role !== 'SUPER_ADMIN') {
                    router.push('/dashboard');
                } else {
                    fetchOrganization();
                }
            } catch (err) {
                router.push('/login');
            }
        };
        init();
    }, [router]);

    const toggleTheme = () => {
        const newTheme = !darkMode;
        setDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const fetchOrganization = async () => {
        try {
            const res = await api.get('/organization/profile');
            setOrganization(res.data);
        } catch (error) {
            console.error("Failed to fetch organization", error);
        } finally {
            setLoading(false);
        }
    };

    const isAuthorized = currentUser && (currentUser.role === 'SYSTEM_ADMIN' || currentUser.role === 'SUPER_ADMIN');
    if (!isAuthorized && !loading) {
        return null;
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 flex overflow-hidden ${
            darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
            {/* Sidebar */}
            <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} user={currentUser} />

            {/* Main Section */}
            <div className="flex-1 flex flex-col h-screen overflow-y-auto relative">
                
                {/* Header */}
                <header className={`h-16 px-8 border-b flex items-center justify-between shrink-0 relative z-20 backdrop-blur-md ${
                    darkMode ? 'border-slate-900 bg-slate-900/10' : 'border-slate-200 bg-white/60'
                }`}>
                    <h2 className="text-xl font-black tracking-tight">Organization Profile</h2>
                    
                    <button
                        onClick={toggleTheme}
                        className={`p-2.5 rounded-xl border transition-all duration-200 ${
                            darkMode 
                                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-800' 
                                : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-slate-50'
                        }`}
                    >
                        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                </header>

                <main className="p-8 max-w-4xl mx-auto w-full">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : organization ? (
                        <div className="space-y-8">
                            <div className="relative">
                                <div className={`h-48 rounded-[48px] shadow-2xl ${darkMode ? 'bg-emerald-900/40' : 'bg-emerald-600'}`}></div>
                                <div className="absolute -bottom-16 left-12 flex items-end gap-6">
                                    <div className={`w-32 h-32 rounded-[40px] shadow-2xl border-4 flex items-center justify-center font-black text-4xl overflow-hidden ${
                                        darkMode ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-white border-white text-emerald-600'
                                    }`}>
                                        {organization.name?.[0] || 'O'}
                                    </div>
                                    <div className="pb-4">
                                        <h1 className="text-3xl font-black tracking-tight">{organization.name}</h1>
                                        <p className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Registration: {organization.registrationCode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-20">
                                <div className={`p-10 rounded-[48px] shadow-xl border ${
                                    darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
                                }`}>
                                    <h3 className="text-xl font-black tracking-tight mb-8">Organization Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                <Building2 className="w-3.5 h-3.5" /> Name
                                            </div>
                                            <div className="font-bold">{organization.name}</div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                <MapPin className="w-3.5 h-3.5" /> Country
                                            </div>
                                            <div className="font-bold">{organization.country || 'N/A'}</div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                <CheckCircle className="w-3.5 h-3.5" /> Registration Code
                                            </div>
                                            <div className="font-bold">{organization.registrationCode}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">Organization data not found.</div>
                    )}
                </main>
            </div>
        </div>
    );
}
