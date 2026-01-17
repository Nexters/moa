import { useUIStore } from '~/stores/ui-store';

export function SettingsHeader() {
  const setShowSettings = useUIStore((s) => s.setShowSettings);

  return (
    <div className="flex items-center justify-between border-b border-white/10 p-4">
      <button
        type="button"
        onClick={() => setShowSettings(false)}
        className="flex cursor-pointer items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
      >
        ← 뒤로
      </button>
      <h1 className="font-medium">설정</h1>
      <div className="w-12" /> {/* 균형을 위한 빈 공간 */}
    </div>
  );
}
