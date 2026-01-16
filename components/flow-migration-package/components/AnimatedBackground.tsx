import React from 'react';

export const AnimatedBackground = () => {
    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
            {/* Orb 1: Purple - Top Left */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-900/30 dark:mix-blend-lighten"></div>

            {/* Orb 2: Yellow/Orange - Top Right */}
            <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:bg-yellow-900/30 dark:mix-blend-lighten"></div>

            {/* Orb 3: Pink - Bottom Left */}
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:bg-pink-900/30 dark:mix-blend-lighten"></div>

            {/* Overlay for better text contrast if needed */}
            <div className="absolute inset-0 bg-white/30 dark:bg-black/20 backdrop-blur-[1px]"></div>
        </div>
    );
};
