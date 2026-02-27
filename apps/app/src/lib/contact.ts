import { openUrl } from '@tauri-apps/plugin-opener';

const CONTACT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdIvB3ql_ZIAV2_65yyM0-nAkRygjnGYtGVfIN8-KDiEPzAvg/viewform';

export async function openContactForm() {
  await openUrl(CONTACT_FORM_URL);
}
