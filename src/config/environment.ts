import * as Joi from 'joi';

export const environmentSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('local', 'development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),
  CORS_ORIGINS: Joi.string().default('http://localhost:3001'),
  THROTTLE_TTL_MS: Joi.number().integer().positive().default(60000),
  THROTTLE_LIMIT: Joi.number().integer().positive().default(100),
  SWAGGER_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  JWT_ACCESS_SECRET: Joi.string()
    .min(32)
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('local-access-secret-change-before-production-123456'),
    }),
  JWT_ACCESS_TTL: Joi.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: Joi.number().integer().min(1).max(365).default(30),
  EMAIL_VERIFICATION_TTL_HOURS: Joi.number().integer().min(1).max(168).default(24),
  PASSWORD_RESET_TTL_MINUTES: Joi.number().integer().min(5).max(1440).default(30),
});

export function getCorsOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
