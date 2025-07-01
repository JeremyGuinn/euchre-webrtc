interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  size = "md", 
  message = "Loading...",
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Spinning card symbols */}
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 animate-spin">
          <div className="text-red-600 text-2xl animate-pulse">♥️</div>
        </div>
        <div className={`absolute inset-0 animate-spin ${size === 'lg' ? 'animation-delay-75' : ''}`} style={{ animationDelay: '0.25s' }}>
          <div className="text-black text-2xl animate-pulse">♠️</div>
        </div>
        <div className={`absolute inset-0 animate-spin ${size === 'lg' ? 'animation-delay-150' : ''}`} style={{ animationDelay: '0.5s' }}>
          <div className="text-red-600 text-2xl animate-pulse">♦️</div>
        </div>
        <div className={`absolute inset-0 animate-spin ${size === 'lg' ? 'animation-delay-300' : ''}`} style={{ animationDelay: '0.75s' }}>
          <div className="text-black text-2xl animate-pulse">♣️</div>
        </div>
      </div>
      
      {message && (
        <p className="text-gray-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}

export function GameLoadingScreen({ message = "Loading game..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Card table decoration */}
        <div className="text-6xl mb-6 space-x-2">
          <span className="text-black animate-bounce">♠️</span>
          <span className="text-red-600 animate-bounce" style={{ animationDelay: '0.1s' }}>♥️</span>
          <span className="text-red-600 animate-bounce" style={{ animationDelay: '0.2s' }}>♦️</span>
          <span className="text-black animate-bounce" style={{ animationDelay: '0.3s' }}>♣️</span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Euchre Online
          </h2>
          <LoadingSpinner size="lg" message={message} />
        </div>

        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            <p>🔒 No registration required</p>
            <p>🌐 Peer-to-peer connection</p>
            <p>👥 4 players needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
