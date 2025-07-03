import React from "react";

interface NotificationBannerProps {
    message: string;
    type?: "info" | "warning" | "error" | "success";
    onDismiss?: () => void;
    className?: string;
}

const typeConfig = {
    info: {
        bgColor: "bg-blue-100",
        borderColor: "border-blue-400",
        textColor: "text-blue-700",
        icon: "ℹ️"
    },
    warning: {
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-400",
        textColor: "text-yellow-700",
        icon: "⚠️"
    },
    error: {
        bgColor: "bg-red-100",
        borderColor: "border-red-400",
        textColor: "text-red-700",
        icon: "⚠️"
    },
    success: {
        bgColor: "bg-green-100",
        borderColor: "border-green-400",
        textColor: "text-green-700",
        icon: "✅"
    }
};

export default function NotificationBanner({
    message,
    type = "info",
    onDismiss,
    className = ""
}: NotificationBannerProps) {
    const config = typeConfig[type];

    return (
        <div className={`${config.bgColor} border ${config.borderColor} ${config.textColor} px-4 py-3 rounded-lg ${className}`}>
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <span className={`${config.textColor}`}>{config.icon}</span>
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{message}</p>
                </div>
                {onDismiss && (
                    <div className="ml-3">
                        <button
                            onClick={onDismiss}
                            className={`${config.textColor} hover:opacity-75`}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
