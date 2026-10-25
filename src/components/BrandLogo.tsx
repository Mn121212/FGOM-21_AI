import React, { useState, useEffect } from "react";
import { Terminal } from "lucide-react";
import defaultFgomLogo from "../assets/images/fgom21_ai_icon_1788721441022.jpg";

interface BrandLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const LOGO_STORAGE_KEY = "fgom21_custom_logo";

export const getStoredCustomLogo = (): string | null => {
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setStoredCustomLogo = (dataUrl: string | null): void => {
  try {
    if (dataUrl) {
      localStorage.setItem(LOGO_STORAGE_KEY, dataUrl);
    } else {
      localStorage.removeItem(LOGO_STORAGE_KEY);
    }
    window.dispatchEvent(new Event("fgom21_logo_changed"));
  } catch (err) {
    console.error("Failed to update custom logo in storage:", err);
  }
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  size = "md",
  showText = false,
}) => {
  const [logoSrc, setLogoSrc] = useState<string | null>(() => getStoredCustomLogo() || defaultFgomLogo || "/assets/FGOM.png");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setLogoSrc(getStoredCustomLogo() || defaultFgomLogo || "/assets/FGOM.png");
      setHasError(false);
    };

    window.addEventListener("fgom21_logo_changed", handleUpdate);
    return () => window.removeEventListener("fgom21_logo_changed", handleUpdate);
  }, []);

  const sizeClasses = {
    sm: "w-6 h-6 rounded-lg",
    md: "w-9 h-9 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
    xl: "w-20 h-20 rounded-3xl",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-10 h-10",
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} overflow-hidden flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/40 border border-emerald-500/30 bg-neutral-900 group relative`}
      >
        {!hasError && logoSrc ? (
          <img
            src={logoSrc}
            alt="FGOM21 AI Logo"
            className="w-full h-full object-cover object-center transition-transform duration-200 group-hover:scale-105 rounded-xl"
            onError={() => {
              if (logoSrc !== "/assets/FGOM.png") {
                setLogoSrc("/assets/FGOM.png");
              } else {
                setHasError(true);
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white">
            <Terminal className={iconSizes[size]} />
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-neutral-100 font-mono tracking-wide text-sm sm:text-base">
              FGOM21 AI
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#00E676] font-bold border border-emerald-500/30">
              🇸🇦
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">الذكاء الاصطناعي للمطورين</span>
        </div>
      )}
    </div>
  );
};
