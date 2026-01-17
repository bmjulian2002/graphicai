import React, { memo } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { MessageSquare, LayoutGrid } from 'lucide-react';

export const AnnotationNode = memo(({ data, selected }: NodeProps) => {
    return (
        <>
            <NodeResizer
                minWidth={200}
                minHeight={100}
                isVisible={selected}
                lineStyle={{ border: '1px solid #94a3b8' }}
                handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
            />

            <div className={`h-full w-full rounded-2xl border transition-all duration-300 flex flex-col overflow-hidden relative group
                ${selected
                    ? 'border-blue-400/50 bg-blue-50/30 dark:bg-blue-900/10 dark:border-blue-500/30 shadow-sm'
                    : 'border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20'
                }
            `}>
                {/* Header / Drag Handle */}
                <div className="px-4 py-2 flex items-center gap-2 border-b border-transparent group-hover:border-gray-200/50 dark:group-hover:border-gray-700/50 transition-colors cursor-move active:cursor-grabbing">
                    <div className="p-1 rounded-md bg-gray-100/50 dark:bg-gray-800/50 text-gray-400">
                        {data.label === 'Group' ? <LayoutGrid className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-full truncate pointer-events-none">
                        {data.label as string}
                    </span>
                </div>

                {/* Content Area - Visual Only (Empty for grouping) */}
                <div className="flex-1 min-h-0 relative" />

                {selected && (
                    <div className="absolute bottom-2 right-2 text-[10px] text-blue-400/50 font-mono pointer-events-none select-none">
                        Visual Group
                    </div>
                )}
            </div>
        </>
    );
});

AnnotationNode.displayName = 'AnnotationNode';
