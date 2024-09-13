import { WalletMessageBase, WalletMessageType } from './types';

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

export interface SendTrackEventRequest extends WalletMessageBase {
  type: WalletMessageType.SendTrackEventRequest;
  userId: string;
  rpc: string | undefined;
  event: string;
  category: AnalyticsEventCategory;
  properties?: object;
}

export interface SendTrackEventResponse extends WalletMessageBase {
  type: WalletMessageType.SendTrackEventResponse;
}

export interface SendPageEventRequest extends WalletMessageBase {
  type: WalletMessageType.SendPageEventRequest;
  userId: string;
  rpc: string | undefined;
  path: string;
  search: string;
  additionalProperties: object;
}

export interface SendPageEventResponse extends WalletMessageBase {
  type: WalletMessageType.SendPageEventResponse;
}

export type PerformanceTimings = {
  [key: string]: number;
};

export interface SendPerformanceEventRequest extends WalletMessageBase {
  type: WalletMessageType.SendPerformanceEventRequest;
  userId: string;
  rpc: string | undefined;
  event: string;
  timings: PerformanceTimings;
  additionalProperties: object;
}

export interface SendPerformanceEventResponse extends WalletMessageBase {
  type: WalletMessageType.SendPerformanceEventResponse;
}
