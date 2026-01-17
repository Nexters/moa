import { useUIStore } from '~/stores/ui-store';

export function MenuSection() {
  const setShowSettings = useUIStore((s) => s.setShowSettings);

  return (
    <div className="flex flex-col items-center justify-start border-l border-white/10 p-3">
      <button
        type="button"
        onClick={() => setShowSettings(true)}
        className="flex cursor-pointer flex-col items-center gap-1 rounded-lg p-3 transition-colors hover:bg-white/10"
      >
        <span className="text-2xl">⚙️</span>
        <span className="text-xs text-gray-400">설정</span>
      </button>
    </div>
  );
}
