import React, { useState, useEffect, useCallback } from "react";
import { X, AlertCircle, Info, Sparkles, Database, Plus, CheckCircle2 } from "lucide-react";
import { DATABASE_PROVIDERS, PROVIDER_METADATA, type DatabaseProvider, type ConnectedAccountDisplay } from "../types/deployment";
import { PlatformOAuthButton } from "./PlatformOAuthButton";
import { ConnectedAccountsList } from "./ConnectedAccountsList";

interface DatabaseConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectSuccess?: (account: ConnectedAccountDisplay) => void;
}

export const DatabaseConnectorModal: React.FC<DatabaseConnectorModalProps> = ({
  isOpen,
  onClose,
  onConnectSuccess,
}) => {
  const [accounts, setAccounts] = useState<ConnectedAccountDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyDisconnecting, setBusyDisconnecting] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!isOpen) return;
    
    setLoading(true);
    setError("");
    setNotice("");
    
    try {
      const response = await fetch("/api/platform/connections/databases");
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر تحميل الحسابات المتصلة");
      }
      
      const data = await response.json();
      setAccounts(data.accounts || []);
      
      // Check URL for successful connection redirect
      const query = new URLSearchParams(window.location.search);
      if (query.get("status") === "connected" && query.get("integration")) {
        const connectedProvider = query.get("integration") as DatabaseProvider;
        if (DATABASE_PROVIDERS.includes(connectedProvider)) {
          setNotice(`تم ربط حساب ${PROVIDER_METADATA[connectedProvider].displayName} بنجاح!`);
          
          // Clean URL
          window.history.replaceState({}, "", window.location.pathname);
          
          // Reload accounts
          await loadAccounts();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء تحميل الحسابات");
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleConnect = useCallback(async (provider: DatabaseProvider) => {
    setLoading(true);
    setError("");
    setNotice("");
    
    try {
      // Open OAuth flow for this provider
      window.location.href = `/api/platform/oauth/${provider}/start?redirect_to=database`;
    } catch (err) {
      setError("تعذر فتح نافذة الربط");
      setLoading(false);
    }
  }, []);

  const handleDisconnect = useCallback(async (accountId: string) => {
    setBusyDisconnecting(accountId);
    setError("");
    setNotice("");
    
    try {
      const response = await fetch(`/api/platform/connections/${accountId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "تعذر حذف الربط");
      }
      
      // Remove from local state
      setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
      setNotice("تم فصل الحساب بنجاح");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء الفصل");
    } finally {
      setBusyDisconnecting(null);
    }
  }, []);

  const handleUseAccount = useCallback((account: ConnectedAccountDisplay) => {
    onConnectSuccess?.(account);
    onClose();
  }, [onConnectSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      dir="rtl"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 sm:px-7 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300 shrink-0">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">ربط قاعدة بيانات خارجية</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                اربط حساباتك بقواعد البيانات دون الحاجة لإدخال أي مفاتيح يدوياً
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors shrink-0"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-7 space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.05] p-3 text-xs leading-6 text-blue-100/80">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            <p>
              جميع بيانات الربط مخزنة بشكل <strong className="text-blue-200">مشفّر وآمن</strong>.
              لن نطلب منك المحلي أدنى إدخال مفاتيح API يدوياً. ببساطة سجّل الدخول في المنصة الخارجية
              وستتم عملية الربط تلقائياً.
            </p>
          </div>

          {/* Platform Selection Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>اختر منصة قاعدة البيانات</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DATABASE_PROVIDERS.map((provider) => {
                const isConnected = accounts.some((acc) => acc.provider === provider);
                
                return (
                  <PlatformOAuthButton
                    key={provider}
                    provider={provider}
                    isConnected={isConnected}
                    isLoading={loading}
                    onClick={() => handleConnect(provider)}
                    disabled={loading}
                    size="md"
                    showDescription
                  />
                );
              })}
            </div>
          </section>

          {/* Connected Accounts Section */}
          <section className="space-y-3 border-t border-neutral-800 pt-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <span>حساباتي المتصلة ({accounts.length})</span>
              </h3>
              {accounts.length > 0 && (
                <button
                  type="button"
                  onClick={loadAccounts}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-900/50 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تحديث القائمة</span>
                </button>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-700 p-7 text-center text-sm leading-7 text-neutral-400">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto mb-3">
                  <Database className="w-5 h-5 text-neutral-500" />
                </div>
                <p>لم تربط أي قاعدة بيانات بعد</p>
                <p className="text-xs text-neutral-500 mt-2">
                  اختر إحدى المنصات أعلاه لبدء الربط
                </p>
              </div>
            ) : (
              <ConnectedAccountsList
                accounts={accounts}
                onDisconnect={handleDisconnect}
                onUse={handleUseAccount}
                showActions
                busyDisconnecting={busyDisconnecting}
              />
            )}
          </section>
        </div>

        {/* Status Messages */}
        {(notice || error) && (
          <div
            role={error ? "alert" : "status"}
            className={`mx-5 mb-5 flex items-start gap-2 rounded-xl border p-3 text-sm leading-6 ${
              error
                ? "border-red-500/20 bg-red-500/[0.06] text-red-200"
                : "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200"
            }`}
          >
            {error ? (
              <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
            )}
            <span>{error || notice}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseConnectorModal;
