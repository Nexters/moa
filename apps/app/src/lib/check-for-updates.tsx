import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { useEffect, useState } from 'react';

import { logger } from '~/lib/logger';
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
  await relaunch();
}

function useCheckForUpdates({ delay = 5000 }: { delay?: number } = {}) {
  const [update, setUpdate] = useState<Update | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await checkForUpdates();
      if (result) {
        setUpdate(result);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return {
    update,
    clearUpdate: () => setUpdate(null),
  };
}

export function UpdateAlertDialog() {
  const { update, clearUpdate } = useCheckForUpdates();

  return (
    <AlertDialog
      open={!!update}
      onOpenChange={(open) => {
        if (!open) clearUpdate();
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
          <AlertDialogCancel>나중에</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (update) void installUpdate(update);
            }}
          >
            업데이트
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
