import React from "react";
import { Trash2, CheckCircle2, Calendar, MoreVertical } from "lucide-react";
import { type ConnectedAccountDisplay } from "../types/deployment";
import { PROVIDER_METADATA } from "../types/deployment";

interface ConnectedAccountsListProps {
  accounts: ConnectedAccountDisplay[];
  onDisconnect: (accountId: string) => void;
  onUse?: (account: ConnectedAccountDisplay) => void;
  showActions?: boolean;
  busyDisconnecting?: string; // accountId that is currently being disconnected
  className?: string;
}

export const ConnectedAccountsList: React.FC<ConnectedAccountsListProps> = ({
  accounts,
  onDisconnect,
  onUse,
  showActions = true,
  busyDisconnecting,
  className = "",
}) => {
  if (accounts.length === 0) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-SA", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "غير معروف";
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {accounts.map((account) => {
        const metadata = PROVIDER_METADATA[account.provider];
        const isDisconnecting = busyDisconnecting === account.id;

        return (
          <div
            key={account.id}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/60 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Provider icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0`}
                style={{
                  backgroundColor: metadata.bgColor,
                  color: metadata.color,
                }}
              >
                {metadata.emoji}
              </div>

              {/* Account info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold text-neutral-100 truncate"
                    style={{ color: metadata.color }}
                  >
                    {metadata.displayName}
                  </span>
                  {showActions && onUse && (
                    <button
                      type="button"
                      onClick={() => onUse(account)}
                      className="p-1.5 rounded-lg hover:bg-neutral-700/60 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                      title="استخدم هذا الحساب"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5 truncate">
                  {account.label}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>متصل منذ {formatDate(account.connectedAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                {onUse && (
                  <button
                    type="button"
                    onClick={() => onUse(account)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    استخدم
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDisconnect(account.id)}
                  disabled={isDisconnecting}
                  className="p-2 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="فصل الحساب"
                >
                  {isDisconnecting ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConnectedAccountsList;
