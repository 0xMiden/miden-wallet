export const GPU_ACCELERATION_STORAGE_KEY = 'gpu_acceleration';
export const DEFAULT_GPU_ACCELERATION = false;

export function setGPUAcceleration(enabled: boolean) {
  try {
    localStorage.setItem(GPU_ACCELERATION_STORAGE_KEY, JSON.stringify(enabled));
  } catch {}
}

export function isGPUAccelerationEnabled() {
  const stored = localStorage.getItem(GPU_ACCELERATION_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as boolean) : DEFAULT_GPU_ACCELERATION;
}
