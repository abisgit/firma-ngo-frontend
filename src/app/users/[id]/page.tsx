'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Briefcase, Mail, Phone, Calendar, ArrowLeft, Loader2, Key } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export default function StaffDetailPage() {
    const params = useParams();
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<any>(null);

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await api.get(`/users/${params.id}`);
                setStaff(response.data);
            } catch (error) {
                console.error("Failed to load staff details", error);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) fetchStaff();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!staff) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold text-slate-800">Staff member not found</h2>
                <Link href="/users" className="text-blue-600 hover:underline mt-4 inline-block">Return to User Management</Link>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/users" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        {staff.firstName} {staff.lastName}
                    </h1>
                    <p className="text-slate-500 mt-1 capitalize">{staff.role.replace('_', ' ').toLowerCase()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 col-span-1 md:col-span-2">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Profile Information
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> Email Address
                            </label>
                            <p className="text-slate-800">{staff.email}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> System Role
                            </label>
                            <p className="text-slate-800 capitalize">{staff.role.replace('_', ' ').toLowerCase()}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Department
                            </label>
                            <p className="text-slate-800">{staff.department?.name || 'Unassigned'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Joined
                            </label>
                            <p className="text-slate-800">{new Date(staff.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Key className="w-5 h-5 text-blue-600" />
                        Security
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-500 block mb-1">Account Status</label>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${staff.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {staff.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {staff.temporaryPassword && (
                            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <h3 className="text-sm font-semibold text-amber-800 mb-2">Temporary Password</h3>
                                <p className="text-xs text-amber-700 mb-3">This user was recently created. Share this temporary password securely.</p>
                                <div className="bg-white p-2 rounded-lg border border-amber-200 font-mono text-center text-slate-800 tracking-wider">
                                    {staff.temporaryPassword}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
