import React from "react";

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-6xl"
};

export default function PageContainer({
    children,
    className = "",
    maxWidth = "md"
}: PageContainerProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
            <div className={`${maxWidthClasses[maxWidth]} w-full bg-white rounded-lg shadow-lg p-8 ${className}`}>
                {children}
            </div>
        </div>
    );
}
