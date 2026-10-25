import React from "react";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { PROVIDER_METADATA, type OAuthProvider } from "../types/deployment";

interface PlatformOAuthButtonProps {
  provider: OAuthProvider;
  isConnected?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  className?: string;
}

export const PlatformOAuthButton: React.FC<PlatformOAuthButtonProps> = ({
  provider,
  isConnected = false,
  isLoading = false,
  onClick,
  disabled = false,
  size = "md",
  showDescription = false,
  className = "",
}) => {
  const metadata = PROVIDER_METADATA[provider];
  
  // Size classes
  const sizeClasses = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Button styling based on connection state
  const baseClasses = `
    flex items-center justify-between gap-3
    rounded-xl border transition-all
    hover:shadow-md hover:scale-[1.02]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    ${sizeClasses[size]}
    ${className}
  `;

  const connectedClasses = `
    border-emerald-500/30 bg-emerald-950/60
    text-emerald-200 hover:border-emerald-500/50
  `;

  const disconnectedClasses = `
    border-neutral-700 bg-neutral-900/80
    text-neutral-200 hover:border-violet-500/40 hover:bg-neutral-800/80
  `;

  const buttonClasses = isConnected ? connectedClasses : disconnectedClasses;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={baseClasses + buttonClasses}
      title={isConnected ? `مقترن بحساب ${metadata.displayName}` : `ربط بحساب ${metadata.displayName}`}
    >
      <div className="flex items-center gap-2">
        {/* Provider icon/emoji */}
        <span className="text-lg" role="img" aria-label={metadata.displayName}>
          {metadata.emoji}
        </span>
        
        {/* Provider name and description */}
        <div className="text-right">
          <div className="font-bold flex items-center gap-1.5">
            <span>{metadata.displayName}</span>
            {isConnected && (
              <span className="text-emerald-400 text-[10px]">
                <Check className="w-3 h-3" />
              </span>
            )}
          </div>
          {showDescription && (
            <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
              {metadata.description}
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
      ) : isConnected ? (
        <span className="text-[10px] text-emerald-400 font-medium">مướngن</span>
      ) : (
        <ExternalLink className="w-4 h-4 text-neutral-400" />
      )}
    </button>
  );
};

export default PlatformOAuthButton;
