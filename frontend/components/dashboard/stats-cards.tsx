"use client";

import { useMemo } from "react";
import type { Conversation } from "@/lib/types/chat";
import { Card, CardContent } from "@/components/ui/card";
import {
    getTodayConversationCount,
    getResolvedPercentage,
    getHumanEscalationCount,
} from "@/lib/utils/dashboard.utils";
import { Badge } from "../ui/badge";

interface StatsCardsProps {
    conversations: Conversation[];
}

export function StatsCards({ conversations }: StatsCardsProps) {
    const stats = useMemo(
        () => ({
            todayCount: getTodayConversationCount(conversations),
            resolvedPct: getResolvedPercentage(conversations),
            escalationCount: getHumanEscalationCount(conversations),
        }),
        [conversations],
    );

    const statCards = [
        {
            label: "Conversations aujourd'hui",
            value: stats.todayCount,
            delta: "↑ +12 depuis hier",
            deltaColor: "text-white",
        },
        {
            label: "Résolu par l'IA",
            value: `${stats.resolvedPct}%`,
            delta: "↑ +3% cette semaine",
            deltaColor: "text-white",
        },
        {
            label: "Escalades humaines",
            value: stats.escalationCount,
            delta:
                stats.escalationCount > 0
                    ? `● ${stats.escalationCount} en attente`
                    : "● 0 en attente",
            deltaColor:
                stats.escalationCount > 0 ? "text-amber-600" : "text-slate-600",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statCards.map((stat, index) => (
                <Card key={index} className="p-0 rounded-2xl">
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            {stat.label}
                        </div>
                        <div className="text-3xl font-semibold text-foreground">
                            {stat.value}
                        </div>
                        <Badge
                            className={`text-xs mt-2 bg-blue-500 ${stat.deltaColor}`}
                        >
                            {stat.delta}
                        </Badge>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
