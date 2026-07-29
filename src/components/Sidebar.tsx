"use client";

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, LayoutDashboard, Briefcase, FileText, CheckSquare, SearchCheck, LogOut, Sun, Moon } from 'lucide-react';

interface SidebarProps {
    darkMode: boolean;
    toggleTheme: () => void;
    user: any;
}

export default function Sidebar({ darkMode, toggleTheme, user }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const menuItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Projects', path: '/projects', icon: Briefcase },
        { name: 'Documents', path: '/documents', icon: FileText },
        { name: 'Approvals', path: '/approvals', icon: CheckSquare },
        { name: 'Verification', path: '/verify', icon: SearchCheck },
    ];

    return (
        <aside className={`w-64 border-r shrink-0 flex flex-col justify-between transition-colors duration-300 relative z-30 ${
            darkMode ? 'bg-slate-900/50 border-slate-800/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}>
            {/* Upper Section */}
            <div className="flex flex-col flex-1">
                {/* Branding Logo */}
                <div className="h-16 px-6 flex items-center gap-3 border-b border-inherit">
                    <div className="p-1.5 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-md">
                        <Shield className="h-5 w-5 text-slate-950" />
                    </div>
                    <span className={`text-lg font-bold tracking-tight ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                        FIRMA-NGO
                    </span>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                                    isActive
                                        ? (darkMode 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100')
                                        : (darkMode 
                                            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent' 
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent')
                                }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section: Profile, Theme, and Logout */}
            <div className="p-4 border-t border-inherit space-y-4">
                {/* User Profile Card */}
                {user && (
                    <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                        <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-xs font-semibold truncate ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {user.firstName} {user.lastName}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider font-medium">
                                    {user.role?.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Theme & Logout Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-medium transition-all duration-200 ${
                            darkMode 
                                ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-950 text-amber-400' 
                                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        Theme
                    </button>

                    <button
                        onClick={handleLogout}
                        className={`py-2 px-3 rounded-xl border flex items-center justify-center transition-all ${
                            darkMode 
                                ? 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' 
                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10'
                        }`}
                        title="Sign Out"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
