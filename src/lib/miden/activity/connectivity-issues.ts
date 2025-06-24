import { putToStorage, useStorage } from '../front';

const CONNECTIVITY_ISSUES_KEY = 'miden-connectivity-issues';

export interface ConnectivityIssue {
  timestamp: number;
}

export const useConnectivityIssues = (): [connectivityIssues: boolean, dismissConnectivityIssue: () => void] => {
  const [connectivityIssues, setConnectivityIssues] = useStorage<boolean>(CONNECTIVITY_ISSUES_KEY, false);

  const dismissConnectivityIssue = () => {
    setConnectivityIssues(false);
  };

  return [connectivityIssues, dismissConnectivityIssue];
};

export const addConnectivityIssue = async () => {
  await putToStorage(CONNECTIVITY_ISSUES_KEY, true);
};

export const sendConnectivityIssue = async () => {
  chrome.runtime.sendMessage({
    type: 'CONNECTIVITY_ISSUE',
    payload: {
      timestamp: Date.now()
    }
  });
};
