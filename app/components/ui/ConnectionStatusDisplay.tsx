import React from "react";

type ConnectionStatus = "connected" | "connecting" | "disconnected" | "error";

interface ConnectionStatusDisplayProps {
    status: ConnectionStatus;
    className?: string;
}

const statusConfig = {
    connected: {
        color: "text-green-600",
        label: "connected"
    },
    connecting: {
        color: "text-yellow-600",
        label: "connecting"
    },
    disconnected: {
        color: "text-gray-600",
        label: "disconnected"
    },
    error: {
        color: "text-red-600",
        label: "error"
    }
};

export default function ConnectionStatusDisplay({
    status,
    className = ""
}: ConnectionStatusDisplayProps) {
    const config = statusConfig[status];

    return (
        <div className={`flex items-center text-sm text-gray-600 ${className}`}>
            <span>Connection Status:</span>
            <span className={`font-medium ml-2 ${config.color}`}>
                {config.label}
            </span>
        </div>
    );
}
