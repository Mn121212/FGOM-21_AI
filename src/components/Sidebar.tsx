import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Settings,
  Download,
  Terminal,
  Shield,
  Layers,
  Play,
  Bot,
  ShieldAlert,
  GitBranch,
  Languages,
} from "lucide-react";
import { ChatSession } from "../types";
import { exportSessionMarkdown } from "../utils/storage";

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onClearAllSessions: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSandbox?: () => void;
  onOpenAgent?: () => void;
  onOpenSecurity?: () => void;
  onOpenGitHub?: () => void;
  onOpenGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onOpenSettings,
  isOpen,
  onClose,
  onOpenSandbox,
  onOpenAgent,
  onOpenSecurity,
  onOpenGitHub,
  onOpenGuide,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const promptDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setConfirmDeleteId(id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSession(id);
    setConfirmDeleteId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 right-0 z-40 w-72 sm:w-80 bg-neutral-950 border-l border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-neutral-100 text-base tracking-wide font-mono">
                  FGOM21 AI
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 pb-2 space-y-2">
          <button
            id="new-chat-btn"
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>محادثة برمجية جديدة</span>
          </button>

          {/* 4 Core Tools Hub Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {onOpenSandbox && (
              <button
                type="button"
                onClick={() => {
                  onOpenSandbox();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-emerald-300 text-xs font-medium transition-colors cursor-pointer"
                title="استوديو تشغيل ومعاينة الأكواد الحية: اختيار لغة البرمجة وتشغيل ومعاينة فورية لايف"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate">استوديو الأكواد</span>
              </button>
            )}

            {onOpenAgent && (
              <button
                type="button"
                onClick={() => {
                  onOpenAgent();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-teal-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-teal-400" />
                <span className="truncate">الوكيل الذاتي</span>
              </button>
            )}

            {onOpenSecurity && (
              <button
                type="button"
                onClick={() => {
                  onOpenSecurity();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-red-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="truncate">فاحص الأمان</span>
              </button>
            )}

            {onOpenGitHub && (
              <button
                type="button"
                onClick={() => {
                  onOpenGitHub();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 text-blue-300 text-xs font-medium transition-colors cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">مستودع GitHub</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Chats */}
        {sessions.length > 2 && (
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="بحث في المحادثات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 py-1">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 px-4 text-neutral-500 text-xs">
              {sessions.length === 0 ? (
                <div className="space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-neutral-400" />
                  <p>لا توجد محادثات سابقة بعد.</p>
                  <p className="text-[11px] text-neutral-600">
                    تبدأ محادثتك وتُحفظ تلقائياً في ذاكرة المتصفح.
                  </p>
                </div>
              ) : (
                <p>لا توجد نتائج تطابق بحثك.</p>
              )}
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === currentSessionId;
              const isEditing = editingId === session.id;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectSession(session.id);
                      if (window.innerWidth < 1024) onClose();
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-neutral-800/90 text-neutral-100 font-medium border border-neutral-700/60 shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/80"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-emerald-400" : "text-neutral-500"
                      }`}
                    />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveRename(session.id, e);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-neutral-900 border border-emerald-500 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none w-full"
                      />
                    ) : (
                      <span className="truncate text-right block w-full" title={session.title}>
                        {session.title}
                      </span>
                    )}
                  </div>

                  {/* Actions (Export, Rename, Delete) */}
                  <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => saveRename(session.id, e)}
                          className="p-1.5 hover:bg-neutral-700 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          title="حفظ التسمية"
                          aria-label="حفظ التسمية"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          className="p-1.5 hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                          title="إلغاء التسمية"
                          aria-label="إلغاء التسمية"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : confirmDeleteId === session.id ? (
                      <div className="flex items-center gap-1 bg-red-950/80 border border-red-500/40 rounded-lg px-1.5 py-0.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-red-200 font-sans">حذف؟</span>
                        <button
                          type="button"
                          onClick={(e) => confirmDelete(session.id, e)}
                          className="p-1 hover:bg-red-800 text-red-300 hover:text-white rounded transition-colors cursor-pointer"
                          title="تأكيد الحذف"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelDelete}
                          className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 rounded transition-colors cursor-pointer"
                          title="إلغاء الحذف"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportSessionMarkdown(session);
                          }}
                          className="p-1.5 hover:bg-neutral-700/80 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                          title="تصدير كملف Markdown"
                          aria-label="تصدير كملف Markdown"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => startRename(session, e)}
                          className="p-1.5 hover:bg-neutral-700/80 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                          title="إعادة التسمية"
                          aria-label="إعادة التسمية"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => promptDelete(session.id, e)}
                          className="p-1.5 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="حذف المحادثة"
                          aria-label="حذف المحادثة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/90 space-y-2">


          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300 text-xs transition-colors border border-neutral-800/80 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>إعدادات الذكاء الاصطناعي</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">v1.0</span>
          </button>

          {sessions.length > 0 && (
            confirmClearAll ? (
              <div className="flex items-center justify-between p-2 rounded-lg bg-red-950/40 border border-red-500/40 text-xs">
                <span className="text-[11px] text-red-200">مسح كل المحادثات؟</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllSessions();
                      setConfirmClearAll(false);
                    }}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    نعم، امسح
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="w-full text-center py-1 text-[11px] text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
              >
                مسح سجل المحادثات بالكامل
              </button>
            )
          )}
        </div>
      </aside>
    </>
  );
};
