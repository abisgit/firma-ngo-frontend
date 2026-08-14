'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [themeConfig, setThemeConfig] = useState({
        primaryColor: '#10b981', // Default primary-500
        secondaryColor: '#047857'
    });

    useEffect(() => {
        // Function to apply colors to CSS variables
        const applyTheme = (primary: string, secondary: string) => {
            const root = document.documentElement;
            if (pathname === '/login') {
                root.style.setProperty('--primary-color', '#10b981'); // Default fallback
                root.style.setProperty('--secondary-color', '#047857');
                return;
            }
            root.style.setProperty('--primary-color', primary);
            root.style.setProperty('--secondary-color', secondary);
            
            // To support Tailwind opacity scaling with hex values, we need to convert HEX to RGB
            // or rely on modern CSS features. In Tailwind v4 with standard setup, we can use CSS variables directly if they are standard RGB or valid CSS colors.
            // Since `primary` is a HEX string (e.g. #b71010), we can just set it.
        };

        if (pathname === '/login') {
            applyTheme('#10b981', '#047857');
            return;
        }

        // Try load from local storage first to prevent FOUC
        const storedOrg = localStorage.getItem('organization');
        if (storedOrg) {
            try {
                const org = JSON.parse(storedOrg);
                if (org.primaryColor) {
                    setThemeConfig({
                        primaryColor: org.primaryColor,
                        secondaryColor: org.secondaryColor || org.primaryColor,
                    });
                    applyTheme(org.primaryColor, org.secondaryColor || org.primaryColor);
                }
            } catch (e) {}
        }

        // Fetch latest from API if user is authenticated
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/organization/profile')
                .then(res => {
                    if (res.data) {
                        localStorage.setItem('organization', JSON.stringify(res.data));
                        if (res.data.primaryColor) {
                            setThemeConfig({
                                primaryColor: res.data.primaryColor,
                                secondaryColor: res.data.secondaryColor || res.data.primaryColor,
                            });
                            applyTheme(res.data.primaryColor, res.data.secondaryColor || res.data.primaryColor);
                        }
                    }
                })
                .catch(err => console.error('Failed to load organization theme:', err));
        } else {
             applyTheme(themeConfig.primaryColor, themeConfig.secondaryColor);
        }
    }, [themeConfig.primaryColor, themeConfig.secondaryColor, pathname]);

    return (
        <>
            {children}
        </>
    );
}
