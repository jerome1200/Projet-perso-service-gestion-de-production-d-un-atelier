"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // ✅ Autorise le front (Next.js) sur le port 3001
    app.enableCors({
        origin: 'http://localhost:3001',
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('API Gestion Bornes')
        .setDescription('Documentation de l’API pour la gestion des bornes')
        .setVersion('1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map