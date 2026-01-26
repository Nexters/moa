import { useEffect, useRef } from 'react';

import { commands } from '~/lib/tauri-bindings';

/**
 * 누적 월급을 트레이 타이틀에 동기화하는 훅 (macOS 전용)
 * @param amount - 누적 월급 금액 (null이면 아직 로딩 중)
 */
export function useTrayTitleSync(amount: number | null) {
  const prevAmount = useRef<number | null>(null);

  useEffect(() => {
    // null이면 아직 로딩 중
    if (amount === null) return;

    // 정수로 변환 (소수점 제거)
    const rounded = Math.floor(amount);

    // 금액 변경 없으면 스킵
    if (prevAmount.current === rounded) return;

    // 상태 변경 전 업데이트 (실패 시 재시도 스팸 방지)
    prevAmount.current = rounded;

    // 표시 형식: "1,234,567원"
    const title = `${rounded.toLocaleString()}원`;

    // Rust 커맨드 호출
    commands
      .setTrayTitle(title)
      .then((result) => {
        if (result.status === 'error') {
          console.error('트레이 타이틀 설정 실패:', result.error);
        }
      })
      .catch((err: unknown) => {
        console.error('트레이 타이틀 설정 실패:', err);
      });
  }, [amount]);
}
