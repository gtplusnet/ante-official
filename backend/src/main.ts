// Import Sentry instrumentation FIRST - must be before any other imports
import './instrument';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { join } from 'path';
import {
  createSwaggerConfig,
  getSwaggerOptions,
  SWAGGER_CONFIG,
} from './common/swagger/swagger.config';

// Add process monitoring and error handlers FIRST
console.log('[DEBUG] Starting NestJS application...');
console.log('[DEBUG] Node version:', process.version);
console.log('[DEBUG] Memory usage:', process.memoryUsage());
console.log('[DEBUG] Process ID:', process.pid);

// Global error handlers for debugging
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:');
  console.error(error);
  console.error('Stack trace:', error.stack);
  // Don't exit, let it continue for debugging
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[ERROR] Unhandled Promise Rejection at:', promise);
  console.error('[ERROR] Reason:', reason);
  if (reason instanceof Error) {
    console.error('[ERROR] Stack trace:', reason.stack);
  }
  // Don't exit, let it continue for debugging
});

process.on('warning', (warning) => {
  console.warn('[WARNING] Process warning:', warning.name);
  console.warn('[WARNING] Message:', warning.message);
  console.warn('[WARNING] Stack:', warning.stack);
});

// Monitor process exit
process.on('exit', (code) => {
  console.log(`[DEBUG] Process is exiting with code: ${code}`);
});

process.on('SIGTERM', () => {
  console.log('[DEBUG] Received SIGTERM signal');
});

process.on('SIGINT', () => {
  console.log('[DEBUG] Received SIGINT signal');
});

async function bootstrap() {
  try {
    console.log('[DEBUG] Creating NestFactory application...');
    console.log('[DEBUG] Memory before create:', process.memoryUsage());

    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all logging
      abortOnError: false, // Don't abort on error during initialization
    });

    console.log('[DEBUG] NestFactory.create() completed successfully');
    console.log('[DEBUG] Memory after create:', process.memoryUsage());

    // Configure Handlebars view engine with partials and helpers
    console.log('[DEBUG] Configuring Handlebars view engine...');
    const hbs = require('express-hbs');

    // Configure express-hbs engine
    app.engine('hbs', hbs.express4({
      partialsDir: join(__dirname, 'views', 'partials'),
      layoutsDir: join(__dirname, 'views', 'layouts'),
      defaultLayout: join(__dirname, 'views', 'layouts', 'api-documentation.hbs'),
    }));

    app.setBaseViewsDir(join(__dirname, 'views'));
    app.setViewEngine('hbs');

    // Register helpers
    hbs.registerHelper('toLowerCase', function(str) {
      return str ? str.toLowerCase() : '';
    });

    hbs.registerHelper('currentYear', function() {
      return new Date().getFullYear();
    });

    hbs.registerHelper('json', function(context) {
      // If it's already a string (JSON), return it as-is
      if (typeof context === 'string') {
        return context;
      }
      // Otherwise stringify it
      return JSON.stringify(context, null, 2);
    });

    hbs.registerHelper('parseJson', function(jsonString) {
      try {
        if (typeof jsonString === 'object') {
          return jsonString;
        }
        return JSON.parse(jsonString);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return [];
      }
    });

    hbs.registerHelper('cleanCode', function(code) {
      if (!code) return '';

      // Handle the code that might already be escaped
      let cleanCode = code;

      // Replace common HTML entities back to characters for processing
      cleanCode = cleanCode
        .replace(/&quot;/g, '"')
        .replace(/&#x3D;/g, '=')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');

      // Split into lines and remove empty lines at start and end
      let lines = cleanCode.split('\n');

      // Remove leading empty lines
      while (lines.length > 0 && !lines[0].trim()) {
        lines.shift();
      }

      // Remove trailing empty lines
      while (lines.length > 0 && !lines[lines.length - 1].trim()) {
        lines.pop();
      }

      // Find minimum indentation (excluding empty lines)
      let minIndent = Infinity;
      lines.forEach(line => {
        // Only consider non-empty lines for indentation calculation
        if (line.trim()) {
          const match = line.match(/^(\s*)/);
          if (match) {
            minIndent = Math.min(minIndent, match[1].length);
          }
        }
      });

      // If no indentation found or all lines are empty, set to 0
      if (minIndent === Infinity) {
        minIndent = 0;
      }

      // Remove minimum indentation from all lines
      const cleanedLines = lines.map(line => {
        // For empty lines, return empty string
        if (!line.trim()) {
          return '';
        }
        // Remove the common indentation
        return line.substring(minIndent);
      });

      // Join lines and ensure no extra whitespace at start/end
      return cleanedLines.join('\n');
    });

    hbs.registerHelper('formatJson', function(jsonString) {
      try {
        // Parse the JSON
        let parsed;
        if (typeof jsonString === 'object') {
          parsed = jsonString;
        } else {
          parsed = JSON.parse(jsonString);
        }

        // Convert to formatted string with proper indentation
        const formatted = JSON.stringify(parsed, null, 2);

        // Add syntax highlighting with HTML spans
        const highlighted = formatted
          // Strings (both keys and values)
          .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
          .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
          // Numbers
          .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
          // Booleans
          .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
          // Null
          .replace(/: (null)/g, ': <span class="json-null">$1</span>');

        // Return as SafeString to prevent double escaping
        // express-hbs provides SafeString through handlebars property
        const Handlebars = hbs.handlebars || require('handlebars');
        return new Handlebars.SafeString(highlighted);
      } catch (e) {
        // If parsing fails, return the original string
        return jsonString || '';
      }
    });

    console.log('[DEBUG] Handlebars view engine configured with partials and helpers');

    console.log('[DEBUG] Configuring body parser...');
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
    console.log('[DEBUG] Body parser configured');

    console.log('[DEBUG] Setting up global validation pipe...');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    console.log('[DEBUG] Validation pipe configured');

    console.log('[DEBUG] Enabling CORS...');
    app.enableCors({
      origin: '*', // Allow all origins with explicit wildcard
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
      allowedHeaders: '*', // Allow ANY header
      exposedHeaders: ['Content-Length', 'X-Request-Id'],
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });
    console.log('[DEBUG] CORS enabled');

    console.log('[DEBUG] Setting up container...');
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    console.log('[DEBUG] Container configured');

    console.log('[DEBUG] Setting up Swagger documentation...');
    try {
      const config = createSwaggerConfig(SWAGGER_CONFIG);
      const document = SwaggerModule.createDocument(app, config.build());
      SwaggerModule.setup(
        'api/docs',
        app,
        document,
        getSwaggerOptions('ANTE Backend API - Complete Documentation'),
      );
      console.log('[DEBUG] Swagger documentation setup complete');
    } catch (swaggerError) {
      console.error('[ERROR] Failed to setup Swagger:', swaggerError);
      // Continue without Swagger
    }

    console.log('[DEBUG] Adding request logging middleware...');
    app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
    console.log('[DEBUG] Request logging middleware added');

    // SKIP enableShutdownHooks for now - it might be causing issues
    console.log(
      '[DEBUG] SKIPPING enableShutdownHooks (potential issue source)',
    );
    // app.enableShutdownHooks();

    const port = process.env.PORT || 3000;
    console.log(
      `[DEBUG] Attempting to listen on port ${port} with host 0.0.0.0...`,
    );
    console.log('[DEBUG] Memory before listen:', process.memoryUsage());

    // Add timeout to detect if listen hangs
    const listenTimeout = setTimeout(() => {
      console.error('[ERROR] app.listen() timed out after 30 seconds!');
      console.error(
        '[ERROR] The application failed to start listening on port',
        port,
      );
      console.error('[ERROR] Memory at timeout:', process.memoryUsage());
      console.error(
        '[ERROR] This usually indicates a module initialization issue',
      );
    }, 30000);

    try {
      await app.listen(port, '0.0.0.0', () => {
        clearTimeout(listenTimeout);
        console.log('[DEBUG] Server listening callback triggered');
      });
      clearTimeout(listenTimeout);
      console.log(
        '[SUCCESS] Application is running on: http://localhost:' + port,
      );
      console.log('[SUCCESS] Also accessible at: http://0.0.0.0:' + port);
      console.log('[DEBUG] Memory after listen:', process.memoryUsage());
      console.log('[DEBUG] Bootstrap completed successfully!');
    } catch (listenError) {
      clearTimeout(listenTimeout);
      console.error('[ERROR] Failed to start server on port', port);
      console.error('[ERROR] Listen error:', listenError);
      if (listenError instanceof Error) {
        console.error('[ERROR] Error message:', listenError.message);
        console.error('[ERROR] Stack trace:', listenError.stack);
      }
      throw listenError;
    }
  } catch (error) {
    console.error('[FATAL] Bootstrap failed:');
    console.error(error);
    if (error instanceof Error) {
      console.error('[FATAL] Error message:', error.message);
      console.error('[FATAL] Stack trace:', error.stack);
    }
    console.error('[FATAL] Memory at crash:', process.memoryUsage());
    // Exit with error code
    process.exit(1);
  }
}

console.log('[DEBUG] Calling bootstrap()...');
bootstrap().catch((error) => {
  console.error('[FATAL] Bootstrap promise rejected:');
  console.error(error);
  if (error instanceof Error) {
    console.error('[FATAL] Error details:', error.message);
    console.error('[FATAL] Stack:', error.stack);
  }
  process.exit(1);
});
