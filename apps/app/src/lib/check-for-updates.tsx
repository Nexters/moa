import { check, type Update } from '@tauri-apps/plugin-updater';
import { useEffect, useState } from 'react';

import { posthog } from '~/lib/analytics';
import { logger } from '~/lib/logger';
import { commands } from '~/lib/tauri-bindings';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/ui/alert-dialog';

export async function checkForUpdates(): Promise<Update | null> {
  try {
    const update = await check();
    if (update) {
      logger.info(`Update available: ${update.version}`);
      return update;
    }
    return null;
  } catch (error) {
    posthog.captureException(error);
    logger.error(`Update check failed: ${String(error)}`);
    return null;
  }
}

export async function installUpdate(update: Update) {
  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        logger.info(`Downloading ${event.data.contentLength} bytes`);
        break;
      case 'Progress':
        logger.info(`Downloaded: ${event.data.chunkLength} bytes`);
        break;
      case 'Finished':
        logger.info('Download complete, installing...');
        break;
    }
  });
  await commands.restartApp();
}

export function useCheckForUpdates({ delay = 2000 }: { delay?: number } = {}) {
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await checkForUpdates();
      if (result) {
        setUpdate(result);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const install = async () => {
    if (!update) return;
    setInstalling(true);
    try {
      await installUpdate(update);
    } catch (error) {
      logger.error(`Update install failed: ${String(error)}`);
      setInstalling(false);
    }
  };

  return {
    update,
    clearUpdate: () => setUpdate(null),
    installing,
    install,
  };
}

export function UpdateAlertDialog() {
  const { update, clearUpdate, installing, install } = useCheckForUpdates();

  return (
    <AlertDialog
      open={!!update}
      onOpenChange={(open) => {
        if (!open && !installing) clearUpdate();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>새로운 버전이 있어요</AlertDialogTitle>
          <AlertDialogDescription>
            {`v${update?.version} 버전으로 업데이트할 수 있어요.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary" disabled={installing}>
            나중에
          </AlertDialogCancel>
          <AlertDialogAction autoFocus disabled={installing} onClick={install}>
            {installing ? '업데이트 중...' : '업데이트'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
