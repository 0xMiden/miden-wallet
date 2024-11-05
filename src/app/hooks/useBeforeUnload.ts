import { useEffect } from 'react';

function useBeforeUnload(promptMessage: string, enabled: boolean, additionalAction?: () => void) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (additionalAction) {
        additionalAction();
      }
      if (!enabled) return;
      event.preventDefault();
      event.returnValue = promptMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [promptMessage, enabled, additionalAction]);
}

export default useBeforeUnload;
