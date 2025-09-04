export enum HealthCheckStatus {
  Healthy = 'healthy',
  Degraded = 'degraded',
  Unhealthy = 'unhealthy',
  Unknown = 'unknown'
}

export interface HealthCheckResponse {
  status: HealthCheckStatus;
  checks_analyzed: number;
  successful_checks: number;
  failed_checks: number;
}

const MONITOR_BASE_URL = 'https://zsxlv6nv03.execute-api.us-west-2.amazonaws.com/prod/';

export class MonitorServiceClient {
  static async healthCheck(): Promise<HealthCheckStatus> {
    try {
      const response = await fetch(`${MONITOR_BASE_URL}/health/create_wallet`);

      if (!response.ok) {
        console.error(`Health check failed with status: ${response.status}`);
        return HealthCheckStatus.Unknown;
      }

      const data: HealthCheckResponse = await response.json();
      return data.status;
    } catch (error) {
      console.error('An error occurred during the health check:', error);
      return HealthCheckStatus.Unknown;
    }
  }
}
