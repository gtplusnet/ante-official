import { Controller, Post, Get, Res, HttpStatus, Inject } from '@nestjs/common';
import { DeveloperScriptsService } from './developer-scripts.service';
import { UtilityService } from '@common/utility.service';
import { isSentryEnabled } from '../../../../instrument';
import * as Sentry from '@sentry/nestjs';

@Controller('developer-scripts')
export class DeveloperScriptsController {
  @Inject() public developerScriptsService: DeveloperScriptsService;
  @Inject() public utility: UtilityService;

  @Post('reset-all')
  async resetAll(@Res() response) {
    try {
      await this.developerScriptsService.resetAll();
      return response.status(HttpStatus.OK).json({
        message: 'Defaults initialized successfully.',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Defaults cannot be initialized.',
      );
    }
  }

  @Post('initialize-defaults')
  async initializeDefaults(@Res() response) {
    try {
      await this.developerScriptsService.initializeDefaults();
      return response.status(HttpStatus.OK).json({
        message: 'Defaults initialized successfully.',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Defaults cannot be initialized.',
      );
    }
  }

  @Post('reset-project')
  async resetProject(@Res() response) {
    try {
      await this.developerScriptsService.resetProject();
      return response.status(HttpStatus.OK).json({
        message: 'Project reset successfully.',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Project cannot be reset.',
      );
    }
  }

  @Post('reset-warehouse')
  async resetWarehouse(@Res() response) {
    try {
      await this.developerScriptsService.resetWarehouse();
      return response.status(HttpStatus.OK).json({
        message: 'Warehouse reset successfully.',
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Warehouse cannot be reset.',
      );
    }
  }

  @Post('update-account-search-keywords')
  async updateAccountSearchKeywords(@Res() response) {
    try {
      const result =
        await this.developerScriptsService.updateAllAccountSearchKeywords();
      return response.status(HttpStatus.OK).json({
        message: 'Account search keywords updated successfully.',
        ...result,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Account search keywords could not be updated.',
      );
    }
  }

  @Post('test-task-update')
  async testTaskUpdate(@Res() response) {
    try {
      const result = await this.developerScriptsService.testTaskUpdate();
      return response.status(HttpStatus.OK).json({
        message: 'Task update test completed.',
        result,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Task update test failed.',
      );
    }
  }

  @Post('test-filing-update')
  async testFilingUpdate(@Res() response) {
    try {
      const result = await this.developerScriptsService.testFilingUpdate();
      return response.status(HttpStatus.OK).json({
        message: 'Filing update test completed.',
        result,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Filing update test failed.',
      );
    }
  }

  // Sentry Debug Endpoints - Only available when Sentry is enabled (staging/production)
  @Get('debug-sentry')
  async debugSentry(@Res() response) {
    // Check Sentry status dynamically
    const environment = process.env.NODE_ENV || 'development';
    const sentryEnabled =
      ['development', 'staging', 'production'].includes(environment) &&
      !!process.env.SENTRY_DSN;

    if (!sentryEnabled) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message: 'Sentry debug endpoint requires SENTRY_DSN to be configured.',
        environment: environment,
        sentryEnabled: false,
        hasSentryDsn: !!process.env.SENTRY_DSN,
      });
    }

    try {
      // Trigger a test error that Sentry should capture
      throw new Error('This is a test error to verify Sentry integration!');
    } catch (err) {
      // Manually capture the error to Sentry
      Sentry.captureException(err);

      return this.utility.errorResponse(
        response,
        err,
        'Sentry test error triggered successfully. Check your Sentry dashboard.',
      );
    }
  }

  @Get('debug-sentry-performance')
  async debugSentryPerformance(@Res() response) {
    if (!isSentryEnabled) {
      return response.status(HttpStatus.NOT_FOUND).json({
        message:
          'Sentry debug endpoint is only available in staging and production environments.',
        environment: process.env.NODE_ENV || 'development',
        sentryEnabled: false,
      });
    }

    return Sentry.startSpan(
      {
        op: 'test',
        name: 'Backend Sentry Performance Test',
      },
      async () => {
        try {
          // Simulate some async work
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Simulate a child span
          return await Sentry.startSpan(
            {
              op: 'db_query',
              name: 'Mock Database Query',
            },
            async () => {
              await new Promise((resolve) => setTimeout(resolve, 50));

              return response.status(HttpStatus.OK).json({
                message: 'Sentry performance test completed successfully!',
                environment: process.env.NODE_ENV,
                timestamp: new Date().toISOString(),
                sentryEnabled: true,
              });
            },
          );
        } catch (err) {
          return this.utility.errorResponse(
            response,
            err,
            'Sentry performance test failed.',
          );
        }
      },
    );
  }

  @Get('debug-sentry-info')
  async debugSentryInfo(@Res() response) {
    return response.status(HttpStatus.OK).json({
      message: 'Sentry configuration information',
      environment: process.env.NODE_ENV || 'development',
      sentryEnabled: isSentryEnabled,
      sentryDsn: isSentryEnabled ? '***configured***' : 'not configured',
      serverName: process.env.SERVER_NAME || 'unknown',
      endpoints: {
        testError: '/developer-scripts/debug-sentry',
        testPerformance: '/developer-scripts/debug-sentry-performance',
        info: '/developer-scripts/debug-sentry-info',
      },
    });
  }
}
