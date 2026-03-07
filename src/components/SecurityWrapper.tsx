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

        </div>
    );
};

export default SecurityWrapper;
