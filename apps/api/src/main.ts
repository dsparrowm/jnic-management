import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { assertProductionConfig } from "./common/production-config";
import { getCorsOrigins } from "./common/web-origin";

async function bootstrap() {
  assertProductionConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
  console.log(`JNLOP API listening on port ${port}`);
}

bootstrap();
