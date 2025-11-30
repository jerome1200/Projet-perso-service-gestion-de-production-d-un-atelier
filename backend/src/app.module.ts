import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { BornesModule } from './bornes/bornes.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PiecesModule } from './pieces/pieces.module';
import { SousAssemblageModule } from './sousAssemblages/sous-assemblage.module';
import { SousAssemblagePiecesModule } from './sousAssemblagesPieces/sous-assemblage-pieces.module';
import { SousSousAssemblageModule } from './sousSousAssemblages/sous-sous-assemblage.module';
import { SousSousAssemblagePiecesModule } from './sousSousAssemblagesPieces/sous-sous-assemblage-pieces.module';
import { SousAssemblageSsasModule } from './sousAssemblagesSousSousAssemblages/sous-assemblage-ssas.module';
import { KitsModule } from './kits/kits.module';
import { KitPiecesModule } from './kitPieces/kit-pieces.module';
import { StockMovementsModule } from './stockMovements/stock-movements.module';
import { TaskTemplatesModule } from './taskTemplates/task-templates.module';
import { ProductionsModule } from './productions/productions.module';
import { ProductionTasksModule } from './productionTasks/production-tasks.module';


@Module({
  imports: [
    BornesModule,
    AuthModule,
    UsersModule,
    PiecesModule,
    SousAssemblageModule,
	SousAssemblagePiecesModule,
    SousSousAssemblageModule,
    SousSousAssemblagePiecesModule,
	SousAssemblageSsasModule,
    KitsModule,
	KitPiecesModule,
	StockMovementsModule,
	TaskTemplatesModule,
    ProductionsModule,
    ProductionTasksModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
