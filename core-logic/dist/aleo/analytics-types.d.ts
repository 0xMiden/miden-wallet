import { AleoMessageBase, AleoMessageType } from './types';
export declare enum AnalyticsEventCategory {
    General = "General",
    ButtonPress = "ButtonPress",
    Toggle = "Toggle",
    FormChange = "FormChange",
    FormSubmit = "FormSubmit",
    FormSubmitSuccess = "FormSubmitSuccess",
    FormSubmitFail = "FormSubmitFail",
    PageOpened = "PageOpened",
    PageClosed = "PageClosed"
}
export declare enum AnalyticsEventEnum {
    AnalyticsEnabled = "AnalyticsEnabled",
    AnalyticsDisabled = "AnalyticsDisabled",
    LanguageChanged = "LanguageChanged",
    FiatCurrencyChanged = "FiatCurrencyChanged"
}
export interface AleoSendTrackEventRequest extends AleoMessageBase {
    type: AleoMessageType.SendTrackEventRequest;
    userId: string;
    rpc: string | undefined;
    event: string;
    category: AnalyticsEventCategory;
    properties?: object;
}
export interface AleoSendTrackEventResponse extends AleoMessageBase {
    type: AleoMessageType.SendTrackEventResponse;
}
export interface AleoSendPageEventRequest extends AleoMessageBase {
    type: AleoMessageType.SendPageEventRequest;
    userId: string;
    rpc: string | undefined;
    path: string;
    search: string;
    additionalProperties: object;
}
export interface AleoSendPageEventResponse extends AleoMessageBase {
    type: AleoMessageType.SendPageEventResponse;
}
export type PerformanceTimings = {
    [key: string]: number;
};
export interface AleoSendPerformanceEventRequest extends AleoMessageBase {
    type: AleoMessageType.SendPerformanceEventRequest;
    userId: string;
    rpc: string | undefined;
    event: string;
    timings: PerformanceTimings;
    additionalProperties: object;
}
export interface AleoSendPerformanceEventResponse extends AleoMessageBase {
    type: AleoMessageType.SendPerformanceEventResponse;
}
//# sourceMappingURL=analytics-types.d.ts.map