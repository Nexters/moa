declare const __APP_VERSION__: string;

const GITHUB_REPO = 'nexters/moa';

export const APP_VERSION = __APP_VERSION__;

type Platform = 'mac-aarch64' | 'mac-x64' | 'windows-x64';

const FILENAMES: Record<Platform, string> = {
  'mac-aarch64': `moa_${APP_VERSION}_aarch64.dmg`,
  'mac-x64': `moa_${APP_VERSION}_x64.dmg`,
  'windows-x64': `moa_${APP_VERSION}_x64-setup.exe`,
};

export function getDownloadUrl(platform: Platform) {
  const baseUrl = `https://github.com/${GITHUB_REPO}/releases/download/v${APP_VERSION}`;
  return `${baseUrl}/${FILENAMES[platform]}`;
}
