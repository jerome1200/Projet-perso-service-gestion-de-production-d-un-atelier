import {
  Controller,
  Post,
  Param,
  Body,
  ParseIntPipe,
  Get,
  Query,
} from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';

@Controller()
export class StockMovementsController {
  constructor(private readonly service: StockMovementsService) {}

// ➕ ajouter du stock
@Post('stock/:type/:id/add')
addStock(
  @Param('type') type: string,
  @Param('id', ParseIntPipe) id: number,
  @Body('quantity', ParseIntPipe) quantity: number,
  @Body('userId') userId?: number,       // 👈 ajout
) {
  return this.service.moveStock({
    type: type as any,
    id,
    quantity,
    operation: 'ADD',
    userId: userId ? Number(userId) : undefined, // 👈 on passe au service
  });
}

// ➖ retirer du stock
@Post('stock/:type/:id/remove')
removeStock(
  @Param('type') type: string,
  @Param('id', ParseIntPipe) id: number,
  @Body('quantity', ParseIntPipe) quantity: number,
  @Body('userId') userId?: number,       // 👈 ajout
) {
  return this.service.moveStock({
    type: type as any,
    id,
    quantity,
    operation: 'REMOVE',
    userId: userId ? Number(userId) : undefined, // 👈 on passe au service
  });
}


  // 🕒 historique des mouvements
  @Get('history/:type/:id')
  getHistory(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.service.getHistory(type as any, id, parsedLimit || 5);
  }


}
