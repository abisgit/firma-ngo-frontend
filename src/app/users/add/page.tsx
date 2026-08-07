'use client';

import React, { useState } from 'react';
import { UserPlus, Save, Loader2, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { getMe } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { useEffect } from 'react';

type Role = string;

export default function AddStaffPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [darkMode, setDarkMode] = useState(false);
    const [successModal, setSuccessModal] = useState<{show: boolean, password?: string, userId?: string}>({ show: false });
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: 'FIELD_OFFICER' as Role
    });

    const allRoles: Role[] = ['SUPER_ADMIN', 'FIELD_OFFICER', 'DONOR', 'COUNTRY_DIRECTOR'];

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
                }
            } catch (err) {
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [router]);

    const toggleTheme = () => {
        const newTheme = !darkMode;
        setDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.post('/api/users', formData);
            const pwd = res.data?.generatedPassword;
            const userId = res.data?.id;
            setSuccessModal({ show: true, password: pwd, userId });
        } catch (error: any) {
            console.error("Failed to add staff", error);
            alert(error.response?.data?.message || "Failed to add staff member.");
        } finally {
            setSaving(false);
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
            <Sidebar darkMode={darkMode} toggleTheme={toggleTheme} user={currentUser} />
            <div className="flex-1 flex flex-col h-screen overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-6 w-full">
                    {loading ? (
                        <div className="flex h-[50vh] items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/users" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-blue-600" />
                        Add Staff Member
                    </h1>
                    <p className="text-slate-500 mt-1">Create a new hospital staff account.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">First Name</label>
                            <input 
                                required
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="e.g. Abebe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Last Name</label>
                            <input 
                                required
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                placeholder="e.g. Kebede"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Email Address</label>
                        <input 
                            required
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            placeholder="doctor@hospital.test"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">System Role</label>
                        <select 
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                        >
                            {allRoles.map(role => (
                                <option key={role} value={role}>{role.replace('_', ' ')}</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">This determines their base permissions, which can be modified in Role Management.</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                        <Link 
                            href="/users"
                            className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all"
                        >
                            Cancel
                        </Link>
                        <button 
                            type="submit"
                            disabled={saving}
                            className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all font-medium disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Create Staff Member
                        </button>
                    </div>
                </form>
            </div>

            {/* Success Modal */}
            {successModal.show && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Staff Created!</h2>
                            <p className="text-slate-600">
                                {formData.firstName} {formData.lastName} has been successfully added to the system.
                            </p>
                            
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                                <p className="text-sm font-medium text-amber-800 mb-2">Temporary Password</p>
                                <div className="bg-white px-4 py-3 rounded-lg border border-amber-200 font-mono text-lg text-slate-800 tracking-wider">
                                    {successModal.password}
                                </div>
                                <p className="text-xs text-amber-700 mt-2">
                                    Please share this password securely. You can always retrieve it later from their staff detail page.
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end space-x-3">
                            <button 
                                onClick={() => router.push('/users')}
                                className="px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Back to Directory
                            </button>
                            <button 
                                onClick={() => router.push(`/users/${successModal.userId}`)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                View Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
