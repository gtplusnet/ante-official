import { api } from 'src/boot/axios';

/**
 * Service for managing workflow instances and transitions
 */
export class WorkflowService {
  /**
   * Get list of workflow instances with filtering options
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with workflow instances
   */
  static async getWorkflowInstances(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/workflow-instance?${queryString}` : '/workflow-instance';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow instances:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific workflow instance
   * @param {number} id - Workflow instance ID
   * @returns {Promise} Workflow instance details
   */
  static async getWorkflowInstance(id) {
    try {
      const response = await api.get(`/workflow-instance/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow instance:', error);
      throw error;
    }
  }

  /**
   * Get workflow timeline for a specific instance
   * @param {number} id - Workflow instance ID
   * @returns {Promise} Workflow timeline data
   */
  static async getWorkflowTimeline(id) {
    try {
      const response = await api.get(`/workflow-instance/${id}/timeline`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow timeline:', error);
      throw error;
    }
  }

  /**
   * Get available actions for a workflow instance
   * @param {number} id - Workflow instance ID
   * @returns {Promise} Available workflow actions
   */
  static async getAvailableActions(id) {
    try {
      const response = await api.get(`/workflow-instance/${id}/actions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available actions:', error);
      throw error;
    }
  }

  /**
   * Perform a workflow transition (approve/reject)
   * @param {number} id - Workflow instance ID
   * @param {Object} transitionData - Transition data including action and remarks
   * @returns {Promise} Updated workflow instance
   */
  static async performTransition(id, transitionData) {
    try {
      const response = await api.post(`/workflow-instance/${id}/transition`, transitionData);
      return response.data;
    } catch (error) {
      console.error('Error performing workflow transition:', error);
      throw error;
    }
  }

  /**
   * Get user's pending workflow instances
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} List of pending workflow instances
   */
  static async getUserPendingWorkflows(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/workflow-instance/user/pending?${queryString}` : '/workflow-instance/user/pending';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching user pending workflows:', error);
      throw error;
    }
  }

  /**
   * Get workflow instance by source (module and sourceId)
   * @param {string} sourceModule - Source module (e.g., 'PETTY_CASH_LIQUIDATION')
   * @param {string} sourceId - Source record ID
   * @returns {Promise} Workflow instance for the source
   */
  static async getWorkflowBySource(sourceModule, sourceId) {
    try {
      const params = {
        sourceModule,
        sourceId,
        limit: 1
      };
      const response = await this.getWorkflowInstances(params);
      return response.data && response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error fetching workflow by source:', error);
      throw error;
    }
  }

  /**
   * Create a new workflow instance
   * @param {Object} data - Workflow instance data
   * @returns {Promise} Created workflow instance
   */
  static async createWorkflowInstance(data) {
    try {
      const response = await api.post('/workflow-instance', data);
      return response.data;
    } catch (error) {
      console.error('Error creating workflow instance:', error);
      throw error;
    }
  }

  /**
   * Cancel a workflow instance
   * @param {number} id - Workflow instance ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} Updated workflow instance
   */
  static async cancelWorkflow(id, reason) {
    try {
      const response = await api.post(`/workflow-instance/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error cancelling workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow statistics for a user
   * @returns {Promise} Workflow statistics
   */
  static async getUserWorkflowStats() {
    try {
      const response = await api.get('/workflow-instance/user/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow statistics:', error);
      throw error;
    }
  }

  /**
   * Get workflow instance tasks
   * @param {number} id - Workflow instance ID
   * @returns {Promise} List of tasks for the workflow instance
   */
  static async getWorkflowTasks(id) {
    try {
      const response = await api.get(`/workflow-instance/${id}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Error fetching workflow tasks:', error);
      throw error;
    }
  }

  /**
   * Check if user can perform action on workflow
   * @param {number} id - Workflow instance ID
   * @param {string} action - Action to check (e.g., 'APPROVE', 'REJECT')
   * @returns {Promise<boolean>} Whether user can perform the action
   */
  static async canPerformAction(id, action) {
    try {
      const availableActions = await this.getAvailableActions(id);
      return availableActions.some(a => a.action === action);
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  }
}

export default WorkflowService;