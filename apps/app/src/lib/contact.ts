import { openUrl } from '@tauri-apps/plugin-opener';

export async function openContactEmail(version?: string) {
  const subject = encodeURIComponent('[문의] 모아 서비스에 문의드립니다.');
  const body = encodeURIComponent(
    [
      '문의 유형: (버그 신고 / 제휴·광고 / 계정·결제 / 신고 / 기능 제안 / 기타)',
      '상세 설명:',
      '스크린샷/영상(선택):',
      '',
      '-----------------------------------------------',
      '아래 정보는 앱에서 자동 기입됨',
      `앱 버전/빌드: v${version ?? 'unknown'}`,
    ].join('\n'),
  );
  await openUrl(`mailto:moa.salary@gmail.com?subject=${subject}&body=${body}`);
}
