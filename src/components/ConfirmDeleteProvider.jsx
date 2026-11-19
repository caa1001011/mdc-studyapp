import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, Trash2, RotateCcw, X } from 'lucide-react';

const ConfirmDeleteContext = createContext(null);

const UNDO_DURATION_MS = 3000;

export function ConfirmDeleteProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [undoToast, setUndoToast] = useState(null); // { id, label, remainingMs }

  const pendingActionRef = useRef(null);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const flushPendingCommit = useCallback(() => {
    clearTimers();
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    setUndoToast(null);
    if (pending?.onCommitDelete) {
      Promise.resolve(pending.onCommitDelete()).catch((err) => {
        console.error('Lỗi khi xóa dữ liệu:', err);
      });
    }
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      if (pendingActionRef.current) {
        flushPendingCommit();
      }
    };
  }, [flushPendingCommit]);

  // Đóng hộp thoại xác nhận bằng phím Escape
  useEffect(() => {
    if (!confirmState) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirmState(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmState]);

  const requestDelete = useCallback((config) => {
    setConfirmState({
      title: config.title || 'Xác nhận xóa',
      message: config.message || 'Bạn có chắc chắn muốn xóa mục này?',
      itemLabel: config.itemLabel || 'Đã xóa mục',
      onOptimisticDelete: config.onOptimisticDelete,
      onUndo: config.onUndo,
      onCommitDelete: config.onCommitDelete,
    });
  }, []);

  const handleConfirm = () => {
    if (!confirmState) return;
    const action = confirmState;
    setConfirmState(null);

    // Nếu đang có 1 lệnh xóa chờ hoàn tác trước đó -> thực thi luôn lệnh cũ
    if (pendingActionRef.current) {
      flushPendingCommit();
    }

    // Xóa lạc quan khỏi UI ngay lập tức
    if (typeof action.onOptimisticDelete === 'function') {
      action.onOptimisticDelete();
    }

    const toastId = Date.now();
    const startedAt = Date.now();
    pendingActionRef.current = action;
    setUndoToast({
      id: toastId,
      label: action.itemLabel,
      remainingMs: UNDO_DURATION_MS,
    });

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, UNDO_DURATION_MS - elapsed);
      setUndoToast((prev) => (prev && prev.id === toastId ? { ...prev, remainingMs: left } : prev));
    }, 50);

    timerRef.current = setTimeout(() => {
      flushPendingCommit();
    }, UNDO_DURATION_MS);
  };

  const handleUndo = () => {
    clearTimers();
    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    setUndoToast(null);
    if (pending && typeof pending.onUndo === 'function') {
      pending.onUndo();
    }
  };

  const secondsLeft = undoToast ? Math.max(1, Math.ceil(undoToast.remainingMs / 1000)) : 0;
  const progressPct = undoToast ? Math.max(0, (undoToast.remainingMs / UNDO_DURATION_MS) * 100) : 0;

  return (
    <ConfirmDeleteContext.Provider value={{ requestDelete }}>
      {children}

      {/* Modal xác nhận xóa chuẩn UI/UX */}
      {confirmState && (
        <div
          onClick={() => setConfirmState(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/45 dark:bg-black/75 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#141628] border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold font-display text-white">
                    {confirmState.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                    {confirmState.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="p-1.5 rounded-xl glass-button text-slate-400 hover:text-white cursor-pointer shrink-0"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmState(null)}
                  className="px-4 py-2 rounded-xl glass-button text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-rose-600/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thanh thông báo Hoàn tác 3 giây */}
      {undoToast && (
        <div className="fixed bottom-5 right-5 z-[80] w-[calc(100%-2.5rem)] max-w-sm rounded-2xl bg-white dark:bg-[#17192e] border border-slate-200 dark:border-purple-400/30 shadow-2xl overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                {undoToast.label}
              </span>
            </div>

            <button
              type="button"
              onClick={handleUndo}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md shadow-purple-600/25 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Hoàn tác ({secondsLeft}s)</span>
            </button>
          </div>

          <div className="w-full h-1 bg-slate-200/70 dark:bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-[width] duration-75 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </ConfirmDeleteContext.Provider>
  );
}

export function useConfirmDelete() {
  const ctx = useContext(ConfirmDeleteContext);
  if (!ctx) {
    throw new Error('useConfirmDelete phải được dùng bên trong ConfirmDeleteProvider');
  }
  return ctx;
}
