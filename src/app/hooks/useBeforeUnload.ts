import { useEffect } from 'react';

function useBeforeUnload(enabled: boolean, additionalAction?: () => void) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (additionalAction) {
        additionalAction();
      }
      if (!enabled) return;
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, additionalAction]);
}

export default useBeforeUnload;
