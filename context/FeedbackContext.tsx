import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar, SnackbarProps } from '../components/Snackbar';
import { ConfirmModal } from '../components/ConfirmModal';

export interface ToastOptions {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  durationMs?: number;
  hasTabBar?: boolean;
  bottomPosition?: number;
}

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string | null;
  isDestructive?: boolean;
}

interface FeedbackContextType {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<SnackbarProps>({
    visible: false,
    message: '',
    type: 'success',
    onDismiss: () => {},
  });

  const [confirmState, setConfirmState] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string | null;
    isDestructive?: boolean;
    resolve?: (value: boolean) => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback(
    ({
      message,
      type = 'success',
      actionLabel,
      onAction,
      durationMs = 5000,
      hasTabBar,
      bottomPosition,
    }: ToastOptions) => {
      setToast({
        visible: true,
        message,
        type,
        actionLabel,
        onAction,
        durationMs,
        hasTabBar,
        bottomPosition,
        onDismiss: hideToast,
      });
    },
    [hideToast]
  );

  const confirm = useCallback(
    ({
      title,
      message,
      confirmText,
      cancelText,
      isDestructive = false,
    }: ConfirmOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfirmState({
          visible: true,
          title,
          message,
          confirmText,
          cancelText,
          isDestructive,
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    confirmState.resolve?.(true);
    setConfirmState((prev) => ({ ...prev, visible: false }));
  }, [confirmState]);

  const handleCancel = useCallback(() => {
    confirmState.resolve?.(false);
    setConfirmState((prev) => ({ ...prev, visible: false }));
  }, [confirmState]);

  return (
    <FeedbackContext.Provider value={{ showToast, hideToast, confirm }}>
      {children}
      <Snackbar {...toast} />
      <ConfirmModal
        visible={confirmState.visible}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        isDestructive={confirmState.isDestructive}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
