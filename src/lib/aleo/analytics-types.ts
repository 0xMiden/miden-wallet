export enum AnalyticsEventCategory {
  General = 'General',
  ButtonPress = 'ButtonPress',
  Toggle = 'Toggle',
  FormChange = 'FormChange',
  FormSubmit = 'FormSubmit',
  FormSubmitSuccess = 'FormSubmitSuccess',
  FormSubmitFail = 'FormSubmitFail',
  PageOpened = 'PageOpened',
  PageClosed = 'PageClosed'
}

export enum AnalyticsEventEnum {
  AnalyticsEnabled = 'AnalyticsEnabled',
  AnalyticsDisabled = 'AnalyticsDisabled',
  LanguageChanged = 'LanguageChanged',
  FiatCurrencyChanged = 'FiatCurrencyChanged'
}

export interface AleoSendTrackEventRequest {
  // type: AleoMessageType.SendTrackEventRequest;
  userId: string;
  rpc: string | undefined;
  event: string;
  category: AnalyticsEventCategory;
  properties?: object;
}

export interface AleoSendTrackEventResponse {
  // type: AleoMessageType.SendTrackEventResponse;
}

export interface AleoSendPageEventRequest {
  // type: AleoMessageType.SendPageEventRequest;
  userId: string;
  rpc: string | undefined;
  path: string;
  search: string;
  additionalProperties: object;
}

export interface AleoSendPageEventResponse {
  // type: AleoMessageType.SendPageEventResponse;
}

export type PerformanceTimings = {
  [key: string]: number;
};

export interface AleoSendPerformanceEventRequest {
  // type: AleoMessageType.SendPerformanceEventRequest;
  userId: string;
  rpc: string | undefined;
  event: string;
  timings: PerformanceTimings;
  additionalProperties: object;
}

export interface AleoSendPerformanceEventResponse {
  // type: AleoMessageType.SendPerformanceEventResponse;
}
