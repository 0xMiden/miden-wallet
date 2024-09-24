import { WalletMessageType } from 'lib/shared/types';

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

export interface WalletSendTrackEventRequest {
  type: WalletMessageType.SendTrackEventRequest;
  userId: string;
  rpc: string | undefined;
  event: string;
  category: AnalyticsEventCategory;
  properties?: object;
}

export interface WalletSendTrackEventResponse {
  type: WalletMessageType.SendTrackEventResponse;
}

export interface WalletSendPageEventRequest {
  type: WalletMessageType.SendPageEventRequest;
  userId: string;
  rpc: string | undefined;
  path: string;
  search: string;
  additionalProperties: object;
}

export interface WalletSendPageEventResponse {
  type: WalletMessageType.SendPageEventResponse;
}

export type PerformanceTimings = {
  [key: string]: number;
};

export interface WalletSendPerformanceEventRequest {
  type: WalletMessageType.SendPerformanceEventRequest;
  userId: string;
  rpc: string | undefined;
  event: string;
  timings: PerformanceTimings;
  additionalProperties: object;
}

export interface WalletSendPerformanceEventResponse {
  type: WalletMessageType.SendPerformanceEventResponse;
}
