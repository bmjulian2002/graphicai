import React from 'react';
import { GitBranch, ArrowRight, Brain } from 'lucide-react';
import { ArchitecturePattern } from '../types';

export const PatternLabel = ({ pattern }: { pattern: ArchitecturePattern }) => {
    const colorMap = {
        router: 'from-blue-500/20 to-cyan-500/20 border-blue-400/30 text-blue-700 dark:text-blue-300',
        distillation: 'from-purple-500/20 to-pink-500/20 border-purple-400/30 text-purple-700 dark:text-purple-300',
        autonomous: 'from-emerald-500/20 to-green-500/20 border-emerald-400/30 text-emerald-700 dark:text-emerald-300'
    };

    const iconMap = {
        router: GitBranch,
        distillation: ArrowRight,
        autonomous: Brain
    };

    const Icon = iconMap[pattern.type];

    return (
        <div
            className="absolute pointer-events-none z-50 animate-in fade-in zoom-in duration-500"
            style={{
                left: `${pattern.position.x}px`,
                top: `${pattern.position.y}px`,
                transform: 'translate(-50%, -50%)'
            }}
        >
            <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full
                bg-gradient-to-r ${colorMap[pattern.type]}
                border backdrop-blur-md shadow-lg
                text-xs font-bold uppercase tracking-wide
            `}>
                <Icon className="w-3.5 h-3.5" />
                <span>{pattern.label}</span>
            </div>
        </div>
    );
};
