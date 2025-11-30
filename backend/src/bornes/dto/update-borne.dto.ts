import { PartialType } from '@nestjs/mapped-types';
import { CreateBorneDto } from './create-borne.dto';

export class UpdateBorneDto extends PartialType(CreateBorneDto) {}
