import { Controller, Get } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../common/decorators/public.decorator';
import { execSync } from 'child_process';

@Controller('health')
export class HealthController {
  private versionInfo: any;
  private deploymentInfo: any;

  constructor() {
    this.loadVersionInfo();
    this.loadDeploymentInfo();
  }

  private loadVersionInfo() {
    try {
      // Load version.json from project root (global version)
      // Try multiple possible paths since working directory can vary
      const possiblePaths = [
        path.join(process.cwd(), 'version.json'), // Current directory (Docker container)
        path.join('/app', 'version.json'), // Explicit Docker path
        path.join(process.cwd(), '..', 'version.json'),
        path.join(process.cwd(), '../../version.json'),
        path.join('/home/jdev/projects/geer-ante', 'version.json'),
        path.join('/home/jdev/projects/ante', 'version.json'),
      ];

      let versionData = null;
      for (const versionPath of possiblePaths) {
        if (fs.existsSync(versionPath)) {
          versionData = fs.readFileSync(versionPath, 'utf-8');
          break;
        }
      }

      if (versionData) {
        this.versionInfo = JSON.parse(versionData);
      } else {
        // Fallback - should not happen in production
        this.versionInfo = {
          version: '0.0.0',
          environment: process.env.NODE_ENV || 'development',
          buildDate: new Date().toISOString(),
          error: 'Global version.json not found',
        };
      }
    } catch (error) {
      this.versionInfo = {
        version: 'unknown',
        environment: process.env.NODE_ENV || 'development',
        error: 'Could not load version info: ' + error.message,
      };
    }
  }

  private loadDeploymentInfo() {
    try {
      // Load deployment-hash.json from project root
      const possiblePaths = [
        path.join(process.cwd(), 'deployment-hash.json'), // Current directory (Docker container)
        path.join('/app', 'deployment-hash.json'), // Explicit Docker path
        path.join(process.cwd(), '..', 'deployment-hash.json'),
        path.join(process.cwd(), '../../deployment-hash.json'),
        path.join('/home/jdev/projects/geer-ante', 'deployment-hash.json'),
        path.join('/home/jdev/projects/ante', 'deployment-hash.json'),
        path.join('/var/www/geer-ante', 'deployment-hash.json'),
      ];

      let deploymentData = null;
      for (const deploymentPath of possiblePaths) {
        if (fs.existsSync(deploymentPath)) {
          deploymentData = fs.readFileSync(deploymentPath, 'utf-8');
          break;
        }
      }

      if (deploymentData) {
        this.deploymentInfo = JSON.parse(deploymentData);
      } else {
        // Fallback - get current git info
        try {
          const gitCommit = execSync('git rev-parse HEAD', {
            encoding: 'utf-8',
          }).trim();
          const gitCommitShort = execSync('git rev-parse --short HEAD', {
            encoding: 'utf-8',
          }).trim();
          const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', {
            encoding: 'utf-8',
          }).trim();

          this.deploymentInfo = {
            deploymentHash: `dev-${gitCommitShort}`,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            gitCommit,
            gitCommitShort,
            gitBranch,
            note: 'Generated from current git state',
          };
        } catch (gitError) {
          this.deploymentInfo = {
            deploymentHash: 'unknown',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            error: 'Could not load deployment info',
          };
        }
      }
    } catch (error) {
      this.deploymentInfo = {
        deploymentHash: 'unknown',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        error: 'Could not load deployment info: ' + error.message,
      };
    }
  }

  @Public()
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ...this.versionInfo,
      deployment: this.deploymentInfo,
    };
  }

  @Public()
  @Get('version')
  version() {
    return this.versionInfo;
  }

  @Public()
  @Get('deployment-hash')
  deploymentHash() {
    return this.deploymentInfo;
  }
}
