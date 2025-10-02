import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class TaskScriptExecutorService {
  private readonly logger = new Logger(TaskScriptExecutorService.name);
  private readonly scriptTimeout: number;
  private readonly scriptsPath: string;

  constructor(private readonly configService: ConfigService) {
    this.scriptTimeout = this.configService.get('TASK_SCRIPT_TIMEOUT', 30000);
    this.scriptsPath = this.configService.get('TASK_SCRIPTS_PATH', 'scripts/tasks');
  }

  /**
   * Execute scripts when a new task is created
   */
  async executeTaskCreationScripts(task: any): Promise<void> {
    this.logger.log(`Executing scripts for newly created task ${task.id}: ${task.title}`);
    console.log('=== TASK SCRIPT EXECUTOR ===');
    console.log(`Task ID: ${task.id}`);
    console.log(`Task Title: ${task.title}`);
    console.log(`Project: ${task.project?.name || 'No project'}`);

    try {
      // Example 1: Execute a notification script
      if (task.assignedToId) {
        await this.executeNotificationScript(task);
      }

      // Example 2: Execute project-specific scripts
      if (task.projectId) {
        await this.executeProjectScript(task);
      }

      // Example 3: Execute priority-based scripts
      if (task.priorityLevel >= 4) {
        await this.executeHighPriorityScript(task);
      }

      // Example 4: Execute custom script based on task properties
      await this.executeCustomScript(task);

      console.log(`✅ All scripts executed successfully for task ${task.id}`);

    } catch (error) {
      this.logger.error(`Script execution failed for task ${task.id}:`, error);
      throw error;
    }
  }

  /**
   * Execute notification script for assigned tasks
   */
  private async executeNotificationScript(task: any): Promise<void> {
    const scriptPath = path.join(this.scriptsPath, 'notify-assignee.js');

    // Check if script exists (you can create these scripts as needed)
    try {
      console.log(`Executing notification script for assignee: ${task.assignedTo?.username}`);

      // For now, just log - replace with actual script execution when script is created
      // const command = `node ${scriptPath} ${task.id} "${task.title}" "${task.assignedTo?.email}"`;
      // const { stdout, stderr } = await execAsync(command, { timeout: this.scriptTimeout });

      // Placeholder implementation
      this.logger.log(`Would execute: notify-assignee.js for task ${task.id}`);
      console.log(`📧 Notification would be sent to: ${task.assignedTo?.username || task.assignedToId}`);

    } catch (error) {
      this.logger.warn(`Notification script failed: ${error.message}`);
    }
  }

  /**
   * Execute project-specific scripts
   */
  private async executeProjectScript(task: any): Promise<void> {
    const projectName = task.project?.name?.toLowerCase().replace(/\s+/g, '-');

    if (!projectName) return;

    console.log(`Checking for project-specific script: ${projectName}`);

    // Placeholder for project-specific logic
    // You can add different scripts for different projects
    switch (projectName) {
      case 'website-redesign':
        this.logger.log('Would execute website-redesign specific scripts');
        break;
      case 'mobile-app':
        this.logger.log('Would execute mobile-app specific scripts');
        break;
      default:
        this.logger.log(`No specific script for project: ${projectName}`);
    }
  }

  /**
   * Execute scripts for high priority tasks
   */
  private async executeHighPriorityScript(task: any): Promise<void> {
    console.log('⚠️  HIGH PRIORITY TASK DETECTED!');
    console.log(`Task: ${task.title}`);
    console.log(`Priority Level: ${task.priorityLevel}`);

    // Placeholder for high priority notifications
    // Could send Slack messages, emails, SMS, etc.
    this.logger.log(`High priority task ${task.id} would trigger urgent notifications`);
  }

  /**
   * Execute custom scripts based on task metadata
   */
  private async executeCustomScript(task: any): Promise<void> {
    // Check for special tags or metadata that might trigger scripts
    if (task.tags && Array.isArray(task.tags)) {
      for (const tag of task.tags) {
        if (tag === 'automation') {
          console.log('🤖 Automation tag detected - would execute automation scripts');
        }
        if (tag === 'client-review') {
          console.log('👥 Client review tag detected - would notify client team');
        }
      }
    }

    // Example: Execute actual shell script (commented out for safety)
    /*
    try {
      const scriptPath = path.join(this.scriptsPath, 'custom-handler.sh');
      const command = `bash ${scriptPath} ${task.id} "${task.title}"`;

      const { stdout, stderr } = await execAsync(command, {
        timeout: this.scriptTimeout,
        env: {
          ...process.env,
          TASK_ID: task.id.toString(),
          TASK_TITLE: task.title,
          TASK_PROJECT_ID: task.projectId?.toString() || '',
        }
      });

      if (stdout) {
        this.logger.log(`Script output: ${stdout}`);
      }
      if (stderr) {
        this.logger.warn(`Script stderr: ${stderr}`);
      }
    } catch (error) {
      this.logger.error('Custom script execution failed:', error);
    }
    */

    // For now, just log what would happen
    console.log('📝 Custom script execution completed (placeholder)');
  }

  /**
   * Utility method to safely execute shell commands
   */
  async executeCommand(command: string, options?: any): Promise<{ stdout: string; stderr: string }> {
    try {
      const defaultOptions = {
        timeout: this.scriptTimeout,
        maxBuffer: 1024 * 1024, // 1MB buffer
        ...options,
      };

      const { stdout, stderr } = await execAsync(command, defaultOptions);
      return {
        stdout: stdout.toString(),
        stderr: stderr.toString()
      };

    } catch (error) {
      this.logger.error(`Command execution failed: ${command}`, error);
      throw error;
    }
  }
}