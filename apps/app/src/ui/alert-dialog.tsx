import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import type { ReactNode } from 'react';

import { Button } from './button';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  children?: ReactNode;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  children,
}: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="fixed inset-0 bg-black/50" />
        <AlertDialogPrimitive.Popup className="bg-bg-primary fixed top-1/2 left-1/2 w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-xl p-5 shadow-xl">
          <AlertDialogPrimitive.Title className="t2-600 text-text-high">
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className="b2-400 text-text-medium mt-2">
              {description}
            </AlertDialogPrimitive.Description>
          )}
          {children}
          <div className="mt-5 flex gap-2">
            <AlertDialogPrimitive.Close
              render={
                <Button variant="secondary" size="md" fullWidth>
                  {cancelText}
                </Button>
              }
            />
            <Button variant="primary" size="md" fullWidth onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
