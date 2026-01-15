import React from 'react';
import { Handle, Position } from '@xyflow/react';

interface TechnicalNodeProps {
    icon: React.ElementType;
    label: string;
    subLabel: string;
    colorClass: string;
    selected: boolean;
    type?: 'source' | 'target' | 'both';
    badge?: React.ReactNode;
}

export const TechnicalNode = ({
    icon: Icon,
    label,
    subLabel,
    colorClass,
    selected,
    type = 'source',
    badge = null
}: TechnicalNodeProps) => {
    return (
        <div
            className={`
                min-w-[180px] bg-white dark:bg-gray-950 
                border rounded-lg shadow-sm relative
                ${selected
                    ? 'border-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,0.5)] dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                }
            `}
        >
            {/* Dynamic Badge */}
            {badge && (
                <div className="absolute -top-2.5 -right-2 z-10">
                    {badge}
                </div>
            )}

            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-t-lg">
                <Icon className={`w-4 h-4 ${colorClass}`} />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>
            </div>

            <div className="px-3 py-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {subLabel}
                </div>
            </div>

            {(type === 'target' || type === 'both') && (
                <Handle
                    type="target"
                    position={Position.Top}
                    className="!bg-gray-400 !border-2 !border-white dark:!border-gray-950 !w-3 !h-3"
                />
            )}

            {(type === 'source' || type === 'both') && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    className="!bg-gray-400 !border-2 !border-white dark:!border-gray-950 !w-3 !h-3"
                />
            )}
        </div>
    );
};
