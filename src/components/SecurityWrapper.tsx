"use client";

import { useEffect } from 'react';

const SecurityWrapper = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
        // Disable Right Click
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        // Disable specific shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="select-none" style={{ WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
            {children}

            {/* Overlay for Watermark (Optional - Subtle) */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-[9999] flex items-center justify-center overflow-hidden">
                <div className="rotate-45 text-2xl font-bold whitespace-nowrap">
                    {Array(20).fill('Driver Mind • Protegido ').map((t, i) => (
                        <div key={i}>{t.repeat(10)}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SecurityWrapper;
