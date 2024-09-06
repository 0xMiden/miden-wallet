import { nanoid } from 'nanoid';

import { AnalyticsEventCategory, PerformanceTimings } from 'lib/aleo/analytics-types';
import { useLocalStorage } from 'lib/aleo/front/local-storage';

import { assertResponse, request } from '../aleo/front';

interface AnalyticsStateInterface {
  enabled?: boolean;
  userId: string;
}

export const sendTrackEvent = async (
  userId: string,
  rpc: string | undefined,
  event: string,
  category: AnalyticsEventCategory = AnalyticsEventCategory.General,
  properties?: object
) => {
  const res = await request({
    type: 'TODO',
    userId,
    rpc,
    event,
    category,
    properties
  });
};

export const sendPageEvent = async (
  userId: string,
  rpc: string | undefined,
  path: string,
  search: string,
  additionalProperties = {}
) => {
  const res = await request({
    type: 'TODO',
    userId,
    rpc,
    path,
    search,
    additionalProperties
  });
};

export const sendPerformanceEvent = async (
  userId: string,
  rpc: string | undefined,
  event: string,
  timings: PerformanceTimings,
  additionalProperties = {}
) => {
  const res = await request({
    type: 'TODO',
    userId,
    rpc,
    event,
    timings,
    additionalProperties
  });
};

export const useAnalyticsState = () => {
  const [analyticsState, setAnalyticsState] = useLocalStorage<AnalyticsStateInterface>('analytics', {
    enabled: undefined,
    userId: nanoid()
  });

  return {
    analyticsState,
    setAnalyticsState
  };
};
