'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Plus, Loader2, Edit, Save, X, Moon, Sun } from 'lucide-react';
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

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isActive: boolean;
    customPermissions?: Permission[];
    department?: { name: string };
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editedPermissions, setEditedPermissions] = useState<Permission[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [darkMode, setDarkMode] = useState(false);
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
                    fetchUsers();
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


    const fetchUsers = async () => {
        try {
            const res = await api.get('/api/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPermissions = (user: User) => {
        setEditingUser(user);
        // If they have custom permissions use those, otherwise use their default role permissions
        const currentPerms = user.customPermissions || RolePermissions[user.role as Role] || [];
        setEditedPermissions([...currentPerms]);
    };

    const handleTogglePermission = (permission: Permission) => {
        if (editedPermissions.includes(permission)) {
            setEditedPermissions(editedPermissions.filter(p => p !== permission));
        } else {
            setEditedPermissions([...editedPermissions, permission]);
        }
    };

    const handleSavePermissions = async () => {
        if (!editingUser) return;
        setIsSaving(true);
        try {
            const res = await api.put(`/api/users/${editingUser.id}/permissions`, {
                customPermissions: editedPermissions
            });
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, customPermissions: res.data.customPermissions } : u));
            setEditingUser(null);
        } catch (error) {
            console.error("Failed to save permissions", error);
        } finally {
            setIsSaving(false);
        }
    };

    // List of all possible healthcare permissions to show in the toggle list
    const allHealthcarePermissions: { key: Permission, label: string }[] = [
        { key: 'view_dashboard', label: 'View Dashboard' },
        { key: 'view_patients', label: 'View Patients' },
        { key: 'manage_patients', label: 'Manage Patients (Add/Edit)' },
        { key: 'view_appointments', label: 'View Appointments' },
        { key: 'manage_appointments', label: 'Manage Appointments' },
        { key: 'view_medical_records', label: 'View Medical Records' },
        { key: 'manage_medical_records', label: 'Manage Medical Records' },
        { key: 'view_pharmacy', label: 'View Pharmacy' },
        { key: 'manage_pharmacy', label: 'Manage Pharmacy (Stock/Orders)' },
        { key: 'view_laboratory', label: 'View Laboratory' },
        { key: 'manage_laboratory', label: 'Manage Laboratory (Results)' },
        { key: 'view_staff', label: 'View Staff & Doctors' },
        { key: 'manage_staff', label: 'Manage Staff (Add/Edit Roles)' },
        { key: 'view_reports', label: 'View Analytics & Reports' }
    ];

    const isAuthorized = currentUser && (currentUser.role === 'SYSTEM_ADMIN' || currentUser.role === 'SUPER_ADMIN');
    if (!isAuthorized && !isLoading) {
        return null; // Don't render if unauthorized after loading
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
                    <h2 className="text-xl font-black tracking-tight">User Management</h2>
                    
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
                </header>

                <main className="p-8 max-w-7xl mx-auto w-full">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className={`text-2xl font-bold flex items-center ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                                <ShieldCheck className={`w-8 h-8 mr-3 ${darkMode ? 'text-primary-400' : 'text-primary-600'}`} />
                                User Management & Permissions
                    </h1>
                    <p className="text-slate-500 mt-1">Manage hospital staff roles and granular access controls.</p>
                </div>
                    <div className="flex space-x-3">
                        <Link href="/users/roles" className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                            <ShieldCheck size={20} />
                            <span>Role & Permissions</span>
                        </Link>
                        <Link href="/users/add" className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                            <Plus size={20} />
                            <span>Add Staff Member</span>
                        </Link>
                    </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-72">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Access Level</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())).map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4">
                                            <Link href={`/users/${user.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                                                {user.firstName} {user.lastName}
                                            </Link>
                                            <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{user.department?.name || '-'}</td>
                                        <td className="px-6 py-4">
                                            {user.customPermissions ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    Custom Override
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs">Default Role</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleEditPermissions(user)}
                                                className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Permissions Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Manage Permissions</h3>
                                <p className="text-sm text-slate-500 mt-0.5">Customizing access for {editingUser.firstName} {editingUser.lastName}</p>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                {allHealthcarePermissions.map((perm) => {
                                    const isGranted = editedPermissions.includes(perm.key);
                                    return (
                                        <label key={perm.key} className="flex items-start space-x-3 cursor-pointer group p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex items-center h-5 mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isGranted}
                                                    onChange={() => handleTogglePermission(perm.key)}
                                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 focus:ring-offset-0 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <div className={`font-medium text-sm ${isGranted ? 'text-slate-900' : 'text-slate-600'}`}>
                                                    {perm.label}
                                                </div>
                                                <div className="text-xs text-slate-400 font-mono mt-1">{perm.key}</div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end space-x-3">
                            <button 
                                onClick={() => {
                                    // Reset to default role
                                    const defaultPerms = RolePermissions[editingUser.role as Role] || [];
                                    setEditedPermissions([...defaultPerms]);
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors mr-auto"
                            >
                                Reset to Default
                            </button>
                            
                            <button 
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSavePermissions}
                                disabled={isSaving}
                                className="flex items-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 shadow-sm transition-all disabled:opacity-70"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Custom Permissions
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </main>
        </div>
        </div>
    );
}
