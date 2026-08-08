'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Building2, MapPin, Globe, Calendar, CheckCircle, Moon, Sun, Loader2, Edit2, Save, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api, { getMe } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

export default function OrganizationProfilePage() {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [darkMode, setDarkMode] = useState(false);
    const [organization, setOrganization] = useState<any>(() => {
        if (typeof window !== 'undefined') {
            const storedOrg = localStorage.getItem('organization');
            if (storedOrg) return JSON.parse(storedOrg);
        }
        return null;
    });
    const [loading, setLoading] = useState(true);
    
    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        primaryColor: '#10b981', // Default primary-500
        secondaryColor: '#047857', // Default primary-700
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();

    const fetchOrganization = useCallback(async () => {
        try {
            const res = await api.get('/organization/profile');
            setOrganization(res.data);
            localStorage.setItem('organization', JSON.stringify(res.data));
            setEditForm({
                name: res.data.name || '',
                primaryColor: res.data.primaryColor || '#10b981',
                secondaryColor: res.data.secondaryColor || '#047857',
            });
            if (res.data.themeLogoUrl) {
                const baseUrl = api.defaults.baseURL || 'https://firma-ngo-backend.vercel.app';
                setLogoPreview(res.data.themeLogoUrl.startsWith('http') || res.data.themeLogoUrl.startsWith('data:') ? res.data.themeLogoUrl : `${baseUrl}${res.data.themeLogoUrl}`);
            }
        } catch (error) {
            console.error("Failed to fetch organization", error);
        } finally {
            setLoading(false);
        }
    }, []);

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
    }, [router, fetchOrganization]);

    const toggleTheme = () => {
        const newTheme = !darkMode;
        setDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setLogoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let finalLogoUrl = organization.themeLogoUrl;
            
            // Send the base64 string directly to avoid ephemeral disk issues on Vercel
            if (logoFile && logoPreview) {
                finalLogoUrl = logoPreview;
            }

            const updateRes = await api.put('/organization/profile', {
                name: editForm.name,
                primaryColor: editForm.primaryColor,
                secondaryColor: editForm.secondaryColor,
                themeLogoUrl: finalLogoUrl
            });

            setOrganization(updateRes.data);
            if (updateRes.data.themeLogoUrl) {
                const baseUrl = api.defaults.baseURL || 'https://firma-ngo-backend.vercel.app';
                setLogoPreview(updateRes.data.themeLogoUrl.startsWith('http') || updateRes.data.themeLogoUrl.startsWith('data:') ? updateRes.data.themeLogoUrl : `${baseUrl}${updateRes.data.themeLogoUrl}`);
            }
            setIsEditing(false);
            
            // Dispatch event to force sidebar update if possible, but React state will handle it normally on reload
            window.location.reload(); // Simple way to ensure sidebar gets updated theme colors/logo
        } catch (err) {
            console.error('Failed to update organization', err);
        } finally {
            setSaving(false);
        }
    };

    const isAuthorized = currentUser && (currentUser.role === 'SYSTEM_ADMIN' || currentUser.role === 'SUPER_ADMIN');
    if (!isAuthorized && !loading) {
        return null;
    }

    const primaryColor = organization?.primaryColor || '#10b981';
    const secondaryColor = organization?.secondaryColor || '#047857';

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
                    
                    <div className="flex items-center gap-4">
                        {!isEditing && organization && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className={`px-4 py-2 text-sm font-bold rounded-xl border flex items-center gap-2 ${
                                    darkMode ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        )}
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-xl border transition-all duration-200 ${
                                darkMode 
                                    ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-primary-400 hover:bg-slate-800' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:text-primary-600 hover:bg-slate-50'
                            }`}
                        >
                            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                    </div>
                </header>

                <main className="p-8 max-w-4xl mx-auto w-full">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
                        </div>
                    ) : organization ? (
                        <div className="space-y-8">
                            <div className="relative">
                                {/* Banner uses primaryColor or fallback */}
                                <div 
                                    className="h-48 rounded-[48px] shadow-2xl" 
                                    style={{ backgroundColor: darkMode ? secondaryColor : primaryColor, opacity: darkMode ? 0.4 : 1 }}
                                ></div>
                                
                                <div className="absolute -bottom-16 left-12 flex items-end gap-6">
                                    <div className={`w-32 h-32 rounded-[40px] shadow-2xl border-4 flex items-center justify-center font-black text-4xl overflow-hidden relative group ${
                                        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-white'
                                    }`}>
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="Organization Logo" className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <span style={{ color: primaryColor }}>{editForm.name?.[0] || organization.name?.[0] || 'O'}</span>
                                        )}
                                        
                                        {isEditing && (
                                            <div 
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="w-8 h-8 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
                                    
                                    <div className="pb-4 flex flex-col items-start">
                                        {isEditing && (
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mb-3 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-2 shadow-md"
                                            >
                                                <Upload className="w-3.5 h-3.5" /> Upload Organization Logo
                                            </button>
                                        )}
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={editForm.name} 
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                className={`text-3xl font-black tracking-tight bg-transparent border-b-2 focus:outline-none ${darkMode ? 'border-slate-700 text-white' : 'border-slate-300 text-black'}`}
                                                placeholder="Organization Name"
                                            />
                                        ) : (
                                            <h1 className="text-3xl font-black tracking-tight">{organization.name}</h1>
                                        )}
                                        <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                            Registration: {organization.registrationCode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-20">
                                {isEditing ? (
                                    <div className={`p-10 rounded-[48px] shadow-xl border space-y-6 ${
                                        darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'
                                    }`}>
                                        <h3 className="text-xl font-black tracking-tight mb-4">Theme Settings</h3>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Primary Color</label>
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="color" 
                                                        value={editForm.primaryColor}
                                                        onChange={(e) => setEditForm({...editForm, primaryColor: e.target.value})}
                                                        className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                                                    />
                                                    <span className="font-mono text-sm">{editForm.primaryColor}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Secondary Color (Dark Mode)</label>
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="color" 
                                                        value={editForm.secondaryColor}
                                                        onChange={(e) => setEditForm({...editForm, secondaryColor: e.target.value})}
                                                        className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                                                    />
                                                    <span className="font-mono text-sm">{editForm.secondaryColor}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 flex justify-end gap-4 border-t border-slate-200 dark:border-slate-800">
                                            <button 
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    const baseUrl = api.defaults.baseURL || 'https://firma-ngo-backend.vercel.app';
                                                    setLogoPreview(organization.themeLogoUrl ? (organization.themeLogoUrl.startsWith('http') || organization.themeLogoUrl.startsWith('data:') ? organization.themeLogoUrl : `${baseUrl}${organization.themeLogoUrl}`) : null);
                                                    setLogoFile(null);
                                                    setEditForm({
                                                        name: organization.name,
                                                        primaryColor: organization.primaryColor || '#10b981',
                                                        secondaryColor: organization.secondaryColor || '#047857'
                                                    });
                                                }}
                                                className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="px-6 py-2 rounded-xl text-sm font-bold text-white transition-colors flex items-center gap-2"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
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
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                                    <Sun className="w-3.5 h-3.5" /> Theme Primary Color
                                                </div>
                                                <div className="font-bold flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                                                    {primaryColor}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
