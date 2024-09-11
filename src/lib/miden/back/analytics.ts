import Analytics from 'analytics-node';

import {
  AleoSendPageEventRequest,
  AleoSendPerformanceEventRequest,
  AleoSendTrackEventRequest
} from 'lib/miden/analytics-types';

if (!process.env.ALEO_WALLET_SEGMENT_WRITE_KEY) {
  throw new Error("Require a 'ALEO_WALLET_SEGMENT_WRITE_KEY' environment variable to be set");
}

const client = new Analytics(process.env.ALEO_WALLET_SEGMENT_WRITE_KEY);

export const trackEvent = async ({
  userId,
  rpc,
  event,
  category,
  properties
}: Omit<AleoSendTrackEventRequest, 'type'>) => {
  client.track({
    userId,
    event: `${category} ${event}`,
    timestamp: new Date(),
    properties: {
      ...properties,
      event,
      category
    }
  });
};

export const pageEvent = async ({
  userId,
  rpc,
  path,
  search,
  additionalProperties
}: Omit<AleoSendPageEventRequest, 'type'>) => {
  const url = `${path}${search}`;

  client.page({
    userId,
    name: path,
    timestamp: new Date(),
    category: 'AnalyticsEventCategory.PageOpened',
    properties: {
      url,
      path: search,
      referrer: path,
      category: 'AnalyticsEventCategory.PageOpened',

      ...additionalProperties
    }
  });
};

export const performanceEvent = async ({
  userId,
  rpc,
  event,
  timings,
  additionalProperties
}: Omit<AleoSendPerformanceEventRequest, 'type'>) => {
  client.track({
    userId,
    event: `Performance ${event}`,
    timestamp: new Date(),
    properties: {
      ...timings,

      ...additionalProperties
    }
  });
};
