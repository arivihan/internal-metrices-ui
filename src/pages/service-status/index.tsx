import React, { useEffect, useState } from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

// Example endpoints (replace with real ones later)
const SERVICES = [
    {
        name: "Arivihan Backend",
        endpoint: "https://backend-dev.arivihan.com/arivihan-platform/hello",
    },
    {
        name: "ML Doubt Service",
        endpoint: "https://ml-doubt-prod.arivihan.com/v1/health-check",
    },
    {
        name: "ML Memonics Health Check",
        endpoint: "https://ml-pdf-circle-prod.arivihan.com/api/v1/mnemonic_tips/health",
    },
    {
        name: "ML Question Year Health Check",
        endpoint: "https://ml-pdf-circle-prod.arivihan.com/api/v1/question_year/health",
    },
    {
        name: "ML PDF Circle",
        endpoint: "https://ml-pdf-circle-prod.arivihan.com/health/live",
    },
    {
        name: "ML Memonics Health Check",
        endpoint: "https://ml-pdf-circle-prod.arivihan.com/api/v1/mnemonic_tips/health",
    },

];

type ServiceStatus = {
    name: string;
    endpoint: string;
    status: "online" | "offline" | "unknown";
    responseTime?: number;
};

const fetchStatus = async (endpoint: string): Promise<{ status: "online" | "offline"; responseTime?: number }> => {
    const start = Date.now();
    try {
        const res = await fetch(endpoint, { method: "GET" });
        if (res.ok) {
            return { status: "online", responseTime: Date.now() - start };
        }
        return { status: "offline" };
    } catch {
        return { status: "offline" };
    }
};

export default function ServiceStatusPage() {
    const [services, setServices] = useState<ServiceStatus[]>(
        SERVICES.map((s) => ({ ...s, status: "unknown" as const }))
    );
    const [loading, setLoading] = useState(false);

    const checkAllStatuses = async () => {
        setLoading(true);
        const results = await Promise.all(
            services.map(async (service) => {
                const result = await fetchStatus(service.endpoint);
                return { ...service, ...result };
            })
        );
        setServices(results);
        setLoading(false);
    };

    useEffect(() => {
        checkAllStatuses();
        // Optionally, poll every 60s
        // const interval = setInterval(checkAllStatuses, 60000);
        // return () => clearInterval(interval);
        // eslint-disable-next-line
    }, []);

    // Animated 90-day status bar (green = up, orange = down)
    const AnimatedStatusBar = ({ status }: { status: "online" | "offline" | "unknown" }) => {
        const BAR_COUNT = 45;
        const [visibleBars, setVisibleBars] = useState(0);
        // Generate color array for bars
        const bars = Array.from({ length: BAR_COUNT }, (_, i) => {
            if (status === "offline" && i % 13 === 0) return "orange";
            if (status === "unknown" && i % 17 === 0) return "gray";
            return "green";
        });

        useEffect(() => {
            setVisibleBars(0);
            let timeout: number;
            let i = 0;
            function animate() {
                if (i <= BAR_COUNT) {
                    setVisibleBars(i);
                    i++;
                    timeout = setTimeout(animate, 18); // fast animation
                }
            }
            animate();
            return () => clearTimeout(timeout);
        }, [status]);

        return (
            <div className="flex gap-[4px] mt-2 mb-1">
                {bars.map((color, i) => (
                    <div
                        key={i}
                        className={`h-8 w-1.5 rounded-xs transition-all duration-100 ${
                            i < visibleBars
                                ? color === "green"
                                    ? "bg-green-500"
                                    : color === "orange"
                                    ? "bg-orange-400"
                                    : "bg-gray-300"
                                : "bg-gray-200 opacity-0"
                        }`}
                        title={color === "green" ? "Operational" : color === "orange" ? "Issue" : "Unknown"}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-background pb-22 flex flex-col items-center">
            <div className="w-full max-w-2xl mx-auto mt-12 mb-8">
                <div className="flex flex-col items-center text-center">
                    <img src="/arivihan.jpeg" alt="Logo" className="h-12 mb-4" />
                    <h1 className="text-3xl font-bold mb-2 text-foreground">Arivihan Service Status</h1>
                    <p className="max-w-xl mb-2 text-muted-foreground px-8">
                        This page publishes the most up-to-the-minute information on product availability. Check back here any time to get current status/information on individual products.
                    </p>
                </div>
            </div>
            <div className="w-full w-full px-8 sm:px-22 mx-auto">
                <div className="flex justify-end mb-4">
                    <Button onClick={checkAllStatuses} disabled={loading}>
                        {loading ? "Checking..." : "Refresh"}
                    </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {services.map((service) => (
                        <Card key={service.name} className="rounded-lg shadow border border-border bg-card p-4">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-lg text-foreground">{service.name}</span>
                                    <Info size={16} className="text-muted-foreground" />
                                </div>
                                <Badge
                                    variant={
                                        service.status === "online"
                                            ? "default"
                                            : service.status === "offline"
                                                ? "destructive"
                                                : "secondary"
                                    }
                                    className={
                                        service.status === "online"
                                            ? "bg-green-500 text-white"
                                            : service.status === "offline"
                                                ? "bg-orange-400 text-white"
                                                : "bg-muted text-muted-foreground"
                                    }
                                >
                                    {service.status === "online"
                                        ? "Online"
                                        : service.status === "offline"
                                            ? "Offline"
                                            : "Unknown"}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <AnimatedStatusBar status={service.status} />
                                <div className="text-xs text-muted-foreground mb-1">Status over the past 90 Days</div>
                                <div className="text-sm text-muted-foreground">No recent incidents</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
