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

    prevState.current = isWorking;

    // Rust 커맨드 호출
    commands.setTrayIconState(isWorking).catch((err) => {
      console.error('트레이 아이콘 상태 변경 실패:', err);
    });
  }, [isWorking]);
}
