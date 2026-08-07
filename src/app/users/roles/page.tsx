'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api, { getMe } from '@/lib/api';
import Sidebar from '@/components/Sidebar';

type Permission = string;
type Role = string;

const RolePermissions: Record<string, string[]> = {
    'SUPER_ADMIN': ['view_dashboard', 'manage_users', 'view_reports'],
    'FIELD_OFFICER': ['view_dashboard', 'manage_projects', 'view_documents'],
    'DONOR': ['view_dashboard', 'view_reports'],
    'COUNTRY_DIRECTOR': ['view_dashboard', 'manage_projects', 'view_reports', 'manage_users']
};

export default function RoleManagementPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roleOverrides, setRoleOverrides] = useState<Record<string, string[]>>({});
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [darkMode, setDarkMode] = useState(false);
    const router = useRouter();

    const allRoles: Role[] = ['SUPER_ADMIN', 'FIELD_OFFICER', 'DONOR', 'COUNTRY_DIRECTOR'];
    
    // Flatten all possible permissions from the RolePermissions default
    const allPermissions = Array.from(new Set(Object.values(RolePermissions).flat())) as Permission[];

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
                    fetchPermissions();
                }
            } catch (err) {
                router.push('/login');
            }
        };

        const fetchPermissions = async () => {
            try {
                const response = await api.get('/api/roles/permissions');
                setRoleOverrides(response.data || {});
            } catch (error) {
                console.error("Failed to load role permissions", error);
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

    const handleTogglePermission = (role: string, permission: string) => {
        setRoleOverrides(prev => {
            const currentRolePerms = prev[role] || RolePermissions[role as Role] || [];
            let newRolePerms;
            
            if (currentRolePerms.includes(permission as Permission)) {
                newRolePerms = currentRolePerms.filter(p => p !== permission);
            } else {
                newRolePerms = [...currentRolePerms, permission];
            }
            
            return { ...prev, [role]: newRolePerms };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/api/roles/permissions', roleOverrides);
            alert("Role permissions saved successfully!");
        } catch (error) {
            console.error("Failed to save role permissions", error);
            alert("Failed to save permissions.");
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
                <div className="max-w-7xl mx-auto space-y-6 w-full">
                    {loading ? (
                        <div className="flex h-[50vh] items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/users" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-blue-600" />
                            Role Management
                        </h1>
                        <p className="text-slate-500 mt-1">Configure default access permissions for each staff role.</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all text-sm font-medium disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 font-semibold text-slate-700 w-1/4 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Permission</th>
                            {allRoles.map(role => (
                                <th key={role} className="p-4 font-semibold text-slate-700 text-center capitalize">
                                    {role.replace('_', ' ').toLowerCase()}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {allPermissions.map((permission, index) => (
                            <tr key={permission} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                <td className="p-4 border-t border-r border-slate-200 font-medium text-sm text-slate-700 sticky left-0 bg-inherit z-10">
                                    {permission.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </td>
                                {allRoles.map(role => {
                                    const rolePerms = roleOverrides[role] || RolePermissions[role] || [];
                                    const hasPerm = rolePerms.includes(permission);
                                    
                                    return (
                                        <td key={`${role}-${permission}`} className="p-4 border-t border-slate-200 text-center">
                                            <input 
                                                type="checkbox"
                                                checked={hasPerm}
                                                onChange={() => handleTogglePermission(role, permission)}
                                                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
                        </>
                    )}
            </div>
            </div>
        </div>
    );
}
