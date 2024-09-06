import { useEffect } from 'react';

function useBeforeUnload(promptMessage: string, enabled: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!enabled) return;
      event.preventDefault();
      event.returnValue = promptMessage;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [promptMessage, enabled]);
}

export default useBeforeUnload;
