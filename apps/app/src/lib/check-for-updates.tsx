import { relaunch } from '@tauri-apps/plugin-process';
import { check, type Update } from '@tauri-apps/plugin-updater';
import { useEffect, useState } from 'react';

import { posthog } from '~/lib/analytics';
import { logger } from '~/lib/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
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
  const [installing, setInstalling] = useState(false);

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
        <div className="flex flex-col items-center gap-2">
          <AlertDialogCancel variant="link" disabled={installing}>
            나중에
          </AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            disabled={installing}
            onClick={async () => {
              if (!update) return;
              setInstalling(true);
              try {
                await installUpdate(update);
              } catch (error) {
                logger.error(`Update install failed: ${String(error)}`);
                setInstalling(false);
              }
            }}
          >
            {installing ? '업데이트 중...' : '업데이트'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
