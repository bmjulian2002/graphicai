import React from 'react';
import { NodeProps } from '@xyflow/react';
import { Cpu, Brain, Zap, Wrench, Flame, Plug, Monitor, AlertTriangle, Bot, Server, Database, Box } from 'lucide-react';
import { TechnicalNode } from './TechnicalNode';
import { calculateNodeBurnRate } from '../logic/pricing';

export const LLMNode = ({ data, selected }: NodeProps) => {
    let Icon = Bot;
    let colorClass = 'text-purple-500';

    if (data.provider === 'Google') {
        colorClass = 'text-blue-500';
    } else if (data.provider === 'OpenAI') {
        colorClass = 'text-green-500';
    } else if (data.provider === 'Anthropic') {
        colorClass = 'text-orange-500';
    }

    const burnRate = calculateNodeBurnRate(data);

    const ConsumptionBadge = (
        <div className="flex flex-col gap-1 items-end">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${burnRate.color} animate-in zoom-in duration-300`}>
                <Flame className="w-3 h-3 fill-current" />
                <span>{burnRate.formatted}</span>
            </div>
        </div>
    );

    return (
        <TechnicalNode
            icon={Icon}
            label={(data.label as string) || (data.shortName as string)}
            subLabel={data.modelId as string}
            colorClass={colorClass}
            selected={selected}
            type="both"
            badge={ConsumptionBadge}
        />
    );
};

export const MCPNode = ({ data, selected }: NodeProps) => {
    let Icon = Server;
    let label = 'MCP Server';

    const entityType = data.entityType as string;
    if (entityType === 'Database') {
        Icon = Database;
        label = 'Database';
    } else if (entityType === 'Storage') {
        Icon = Box;
        label = 'Storage';
    }

    return (
        <TechnicalNode
            icon={Icon}
            label={(data.label as string) || (data.shortName as string)}
            subLabel={label}
            colorClass="text-emerald-500 dark:text-emerald-400"
            selected={selected}
            type="both"
        />
    );
};

export const ClientNode = ({ data, selected }: NodeProps) => {
    return (
        <TechnicalNode
            icon={Monitor}
            label={(data.label as string) || (data.shortName as string)}
            subLabel="Terminal / UI"
            colorClass="text-blue-600 dark:text-blue-400"
            selected={selected}
            type="source"
        />
    );
};

export const ErrorNode = ({ data, selected }: NodeProps) => {
    return (
        <TechnicalNode
            icon={AlertTriangle}
            label="Error"
            subLabel={(data.message as string) || 'Connection Failed'}
            colorClass="text-red-500"
            selected={selected}
            type="target"
        />
    );
};
