import { ConfigService } from '@nestjs/config';
import { createApplication } from './bootstrap';

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const config = app.get(ConfigService);
  await app.listen(config.get<number>('PORT', 3000), '0.0.0.0');
}

void bootstrap();
