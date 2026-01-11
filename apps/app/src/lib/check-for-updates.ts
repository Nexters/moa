import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';

import { logger } from '~/lib/logger';

export async function checkForUpdates() {
  try {
    const update = await check();
    if (update) {
      logger.info(`Update available: ${update.version}`);

      const shouldUpdate = confirm(
        `Update available: ${update.version}\n\nWould you like to install this update now?`,
      );

      if (shouldUpdate) {
        try {
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

          const shouldRestart = confirm(
            'Update completed successfully!\n\nWould you like to restart the app now to use the new version?',
          );

          if (shouldRestart) {
            await relaunch();
          }
        } catch (updateError) {
          logger.error(`Update installation failed: ${String(updateError)}`);
          alert(
            `Update failed: There was a problem with the automatic download.\n\n${String(updateError)}`,
          );
        }
      }
    }
  } catch (checkError) {
    logger.error(`Update check failed: ${String(checkError)}`);
    // Silent fail for update checks - don't bother user with network issues
  }
}
