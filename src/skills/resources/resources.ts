/**
 * Reports Neo's own process resource usage (memory, CPU, uptime).
 * Rule-based — no training required.
 */

function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder.toFixed(0)}s`;
}

export const useResources = (): string => {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();

  return [
    'Neo resource usage:',
    `  Uptime: ${formatSeconds(process.uptime())}`,
    `  Memory (RSS): ${formatMegabytes(memory.rss)}`,
    `  Heap used: ${formatMegabytes(memory.heapUsed)} / ${formatMegabytes(memory.heapTotal)}`,
    `  External: ${formatMegabytes(memory.external)}`,
    `  CPU user: ${formatSeconds(cpu.user / 1e6)}  system: ${formatSeconds(cpu.system / 1e6)}`,
  ].join('\n');
};
