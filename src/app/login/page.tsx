"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { Shield, Eye, EyeOff, Lock, Mail, Users, ArrowRight, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(false); // Default to light mode (false)
    const router = useRouter();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
        } else {
            setDarkMode(false);
        }
    }, []);

    const toggleTheme = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await login({ email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const fillCredential = (demoEmail: string) => {
        setEmail(demoEmail);
        setPassword('admin123');
    };

    return (
        <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 relative overflow-hidden font-sans ${
            darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}>
            {/* Theme Toggle in Top Right */}
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                        darkMode 
                            ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-950 text-amber-400 hover:text-amber-300' 
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm'
                    }`}
                    title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? <Sun className="h-5 w-5 animate-pulse" /> : <Moon className="h-5 w-5" />}
                </button>
            </div>

            {/* Background elements */}
            <div className={`absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-500 ${
                darkMode ? 'bg-primary-500/10' : 'bg-primary-500/5'
            }`} />
            <div className={`absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none transition-opacity duration-500 ${
                darkMode ? 'bg-blue-500/10' : 'bg-blue-500/5'
            }`} />

            {/* Left Column: Branding / Info (Hidden on mobile) */}
            <div className={`hidden lg:flex lg:w-1/2 p-16 flex-col justify-between border-r backdrop-blur-md relative z-10 transition-colors duration-300 ${
                darkMode ? 'bg-slate-900/40 border-slate-800/50' : 'bg-white/60 border-slate-200'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-tr from-primary-500 to-teal-400 rounded-lg shadow-lg shadow-primary-500/20">
                        <Shield className="h-8 w-8 text-slate-950" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-teal-300">
                        FIRMA-NGO
                    </span>
                </div>

                <div className="space-y-6 max-w-lg">
                    <h1 className={`text-5xl font-extrabold tracking-tight leading-tight transition-colors duration-300 ${
                        darkMode ? 'text-slate-50' : 'text-slate-900'
                    }`}>
                        Secure Logistics for <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-teal-400">
                            International NGOs
                        </span>
                    </h1>
                    <p className={`text-lg leading-relaxed transition-colors duration-300 ${
                        darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                        An enterprise-grade document exchange, signing, and attestation hub designed for global humanitarian operations. Anchored cryptographically to guarantee trust.
                    </p>

                    <div className={`grid grid-cols-2 gap-6 pt-8 border-t transition-colors ${
                        darkMode ? 'border-slate-800/80' : 'border-slate-200'
                    }`}>
                        <div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-primary-400' : 'text-primary-600'}`}>Zero-Trust</div>
                            <div className="text-sm text-slate-500 mt-1">Cryptographic integrity & blockchain anchors</div>
                        </div>
                        <div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>Biometric</div>
                            <div className="text-sm text-slate-500 mt-1">Video-consent attestation for field reports</div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-slate-500">
                    &copy; 2026 FIRMA Platform. All rights reserved.
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
                {/* Mobile branding */}
                <div className="lg:hidden flex items-center gap-2 mb-12">
                    <div className="p-1.5 bg-gradient-to-tr from-primary-500 to-teal-400 rounded-md">
                        <Shield className="h-6 w-6 text-slate-950" />
                    </div>
                    <span className={`text-xl font-bold ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>FIRMA-NGO</span>
                </div>

                <div className={`w-full max-w-md border rounded-2xl p-8 shadow-2xl backdrop-blur-lg transition-colors duration-300 ${
                    darkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                }`}>
                    <div className="mb-8">
                        <h2 className={`text-3xl font-bold ${darkMode ? 'text-slate-50' : 'text-slate-900'}`}>Welcome back</h2>
                        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} mt-2`}>Sign in to your NGO coordinator portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm rounded-lg flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                            <div className="relative">
                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    <Mail className="h-5 w-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`block w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm ${
                                        darkMode 
                                            ? 'bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-600' 
                                            : 'bg-slate-100/50 border-slate-200 text-slate-900 placeholder-slate-400'
                                    }`}
                                    placeholder="officer@firma-ngo.org"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                            <div className="relative">
                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all text-sm ${
                                        darkMode 
                                            ? 'bg-slate-950/50 border-slate-800 text-slate-100 placeholder-slate-600' 
                                            : 'bg-slate-100/50 border-slate-200 text-slate-900 placeholder-slate-400'
                                    }`}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'} transition-colors`}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-teal-500 text-slate-950 font-bold rounded-xl hover:from-primary-400 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group shadow-lg shadow-primary-500/10 text-sm"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                            {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    {/* Quick Demo Login Helpers */}
                    <div className={`mt-8 pt-6 border-t ${darkMode ? 'border-slate-800/80' : 'border-slate-200'}`}>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-4 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" /> Quick Demo Roles (Pass: admin123)
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => fillCredential('officer@firma-ngo.org')}
                                className={`px-3 py-2 border rounded-lg text-xs font-medium text-left transition-all ${
                                    darkMode 
                                        ? 'bg-slate-950/30 hover:bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300' 
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-350 text-slate-700'
                                }`}
                            >
                                Field Officer
                            </button>
                            <button
                                onClick={() => fillCredential('director@firma-ngo.org')}
                                className={`px-3 py-2 border rounded-lg text-xs font-medium text-left transition-all ${
                                    darkMode 
                                        ? 'bg-slate-950/30 hover:bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300' 
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-350 text-slate-700'
                                }`}
                            >
                                Country Director
                            </button>
                            <button
                                onClick={() => fillCredential('manager@firma-ngo.org')}
                                className={`px-3 py-2 border rounded-lg text-xs font-medium text-left transition-all ${
                                    darkMode 
                                        ? 'bg-slate-950/30 hover:bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300' 
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-350 text-slate-700'
                                }`}
                            >
                                Global Manager
                            </button>
                            <button
                                onClick={() => fillCredential('donor@firma-ngo.org')}
                                className={`px-3 py-2 border rounded-lg text-xs font-medium text-left transition-all ${
                                    darkMode 
                                        ? 'bg-slate-950/30 hover:bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300' 
                                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-350 text-slate-700'
                                }`}
                            >
                                Global Donor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
