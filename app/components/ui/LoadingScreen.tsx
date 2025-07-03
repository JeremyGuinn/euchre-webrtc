import React from "react";

interface LoadingScreenProps {
    title: string;
    message: string;
    className?: string;
}

export default function LoadingScreen({
    title,
    message,
    className = ""
}: LoadingScreenProps) {
    return (
        <div className={`text-center ${className}`}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {title}
            </h2>
            <p className="text-gray-600">{message}</p>
        </div>
    );
}
