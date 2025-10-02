import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import { ref } from 'vue';

export interface ManpowerComputeJob {
  id: string;
  employeeId: string;
  employeeName: string;
  deviceId: string;
  deviceName: string;
  date: string;
  timestamp: string;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  errorStack?: string;
  completedAt?: string;
  processingStartedAt?: string;
  processingTime?: number;
  createdAt: string;
}

export interface QueueStats {
  totalToday: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  avgProcessingTime: number;
  successRate: number;
  lastProcessedAt?: string;
}

export interface QueueHealth {
  status: 'healthy' | 'warning' | 'critical';
  stats: QueueStats;
  processor: {
    isProcessing: boolean;
    shouldStop: boolean;
  };
  recommendations?: string[];
}

export const useManpowerQueueStore = defineStore('manpowerQueue', () => {
  // State
  const stats = ref<QueueStats>({
    totalToday: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    processing: 0,
    avgProcessingTime: 0,
    successRate: 0,
  });

  const health = ref<QueueHealth | null>(null);
  const pendingJobs = ref<ManpowerComputeJob[]>([]);
  const processingJobs = ref<ManpowerComputeJob[]>([]);
  const completedJobs = ref<ManpowerComputeJob[]>([]);
  const failedJobs = ref<ManpowerComputeJob[]>([]);
  const selectedJob = ref<ManpowerComputeJob | null>(null);
  const isLoading = ref(false);
  const refreshInterval = ref<NodeJS.Timeout | null>(null);

  // Actions
  async function fetchStats(date?: string) {
    try {
      const params = date ? { date } : {};
      const response = await api.get('/api/manpower-queue/stats', { params });
      stats.value = response.data;
    } catch (error) {
      console.error('Failed to fetch queue stats:', error);
    }
  }

  async function fetchHealth() {
    try {
      const response = await api.get('/api/manpower-queue/health');
      health.value = response.data;
    } catch (error) {
      console.error('Failed to fetch queue health:', error);
    }
  }

  async function fetchJobsByStatus(status: 'pending' | 'processing' | 'completed' | 'failed', date?: string, limit = 100) {
    try {
      isLoading.value = true;
      const params = { status, date, limit };
      const response = await api.get('/api/manpower-queue/jobs', { params });

      switch (status) {
        case 'pending':
          pendingJobs.value = response.data;
          break;
        case 'processing':
          processingJobs.value = response.data;
          break;
        case 'completed':
          completedJobs.value = response.data;
          break;
        case 'failed':
          failedJobs.value = response.data;
          break;
      }
    } catch (error) {
      console.error(`Failed to fetch ${status} jobs:`, error);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchJob(jobId: string) {
    try {
      isLoading.value = true;
      const response = await api.get(`/api/manpower-queue/job/${jobId}`);
      selectedJob.value = response.data;
      return response.data;
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchFailedJobsWithDetails(limit = 50) {
    try {
      isLoading.value = true;
      const response = await api.get('/api/manpower-queue/failed-details', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch failed job details:', error);
      return { total: 0, jobs: [] };
    } finally {
      isLoading.value = false;
    }
  }

  async function retryJob(jobId: string) {
    try {
      isLoading.value = true;
      const response = await api.post(`/api/manpower-queue/retry/${jobId}`);

      // Refresh failed and pending jobs
      await fetchJobsByStatus('failed');
      await fetchJobsByStatus('pending');
      await fetchStats();

      return response.data;
    } catch (error) {
      console.error('Failed to retry job:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteFailedJob(jobId: string) {
    try {
      isLoading.value = true;
      const response = await api.delete(`/api/manpower-queue/failed/${jobId}`);

      // Remove from failed jobs list
      failedJobs.value = failedJobs.value.filter(job => job.id !== jobId);
      await fetchStats();

      return response.data;
    } catch (error) {
      console.error('Failed to delete job:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function clearAllFailedJobs() {
    try {
      isLoading.value = true;
      const response = await api.delete('/api/manpower-queue/failed/all?confirm=yes');

      // Clear failed jobs list
      failedJobs.value = [];
      await fetchStats();

      return response.data;
    } catch (error) {
      console.error('Failed to clear all failed jobs:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  async function triggerProcessing() {
    try {
      const response = await api.post('/api/manpower-queue/processor/trigger');
      return response.data;
    } catch (error) {
      console.error('Failed to trigger processing:', error);
      throw error;
    }
  }

  async function getProcessorStatus() {
    try {
      const response = await api.get('/api/manpower-queue/processor/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get processor status:', error);
      return null;
    }
  }

  function startAutoRefresh(interval = 5000) {
    stopAutoRefresh();
    refreshInterval.value = setInterval(async () => {
      await Promise.all([
        fetchStats(),
        fetchJobsByStatus('pending'),
        fetchJobsByStatus('processing'),
      ]);
    }, interval);
  }

  function stopAutoRefresh() {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
  }

  async function refreshAll(date?: string) {
    await Promise.all([
      fetchStats(date),
      fetchHealth(),
      fetchJobsByStatus('pending', date),
      fetchJobsByStatus('processing', date),
      fetchJobsByStatus('completed', date),
      fetchJobsByStatus('failed', date),
    ]);
  }

  // Computed
  const hasFailedJobs = () => failedJobs.value.length > 0;
  const failedJobsCount = () => failedJobs.value.length;
  const isHealthy = () => health.value?.status === 'healthy';
  const hasWarnings = () => health.value?.status === 'warning';
  const isCritical = () => health.value?.status === 'critical';

  return {
    // State
    stats,
    health,
    pendingJobs,
    processingJobs,
    completedJobs,
    failedJobs,
    selectedJob,
    isLoading,

    // Actions
    fetchStats,
    fetchHealth,
    fetchJobsByStatus,
    fetchJob,
    fetchFailedJobsWithDetails,
    retryJob,
    deleteFailedJob,
    clearAllFailedJobs,
    triggerProcessing,
    getProcessorStatus,
    startAutoRefresh,
    stopAutoRefresh,
    refreshAll,

    // Computed
    hasFailedJobs,
    failedJobsCount,
    isHealthy,
    hasWarnings,
    isCritical,
  };
});