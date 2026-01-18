import { useEffect, useRef } from 'react';

import { commands } from '~/lib/tauri-bindings';

/**
 * 근무 상태에 따라 트레이 아이콘을 동기화하는 훅
 * @param isWorking - 현재 근무 중인지 여부 (null이면 아직 로딩 중)
 */
export function useTrayIconSync(isWorking: boolean | null) {
  const prevState = useRef<boolean | null>(null);

  useEffect(() => {
    // null이면 아직 로딩 중
    if (isWorking === null) return;

    // 상태 변경 없으면 스킵
    if (prevState.current === isWorking) return;

    // 상태 변경 전 업데이트 (실패 시 재시도 스팸 방지)
    prevState.current = isWorking;

    // Rust 커맨드 호출
    commands
      .setTrayIconState(isWorking)
      .then((result) => {
        if (result.status === 'error') {
          console.error('트레이 아이콘 상태 변경 실패:', result.error);
        }
      })
      .catch((err: unknown) => {
        // JS 레벨 에러 (네트워크 등)
        console.error('트레이 아이콘 상태 변경 실패:', err);
      });
  }, [isWorking]);
}
