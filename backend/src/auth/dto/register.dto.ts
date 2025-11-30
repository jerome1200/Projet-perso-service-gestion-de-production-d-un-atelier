import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'admin@test.com' })
  email: string;

  @ApiProperty({ example: 'admin123' })
  password: string;

  @ApiProperty({ example: 'ADMIN', enum: ['USER', 'ADMIN'], required: false })
  role?: 'USER' | 'ADMIN';
}
