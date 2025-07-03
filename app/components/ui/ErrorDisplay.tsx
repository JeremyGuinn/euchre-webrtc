import React from "react";

interface ErrorDisplayProps {
    error: string;
    icon?: string;
    className?: string;
}

export default function ErrorDisplay({
    error,
    icon = "⚠️",
    className = ""
}: ErrorDisplayProps) {
    return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
            <div className="flex items-center">
                <div className="text-red-500 mr-2">{icon}</div>
                <p className="text-red-700 text-sm">{error}</p>
            </div>
        </div>
    );
}
