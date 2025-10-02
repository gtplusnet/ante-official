import { ApiProperty } from '@nestjs/swagger';

export class PublicMetaDto {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  pageSize: number;

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  pageCount: number;
}

export class PublicContentResponseDto {
  @ApiProperty({ description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Content data' })
  data: any;

  @ApiProperty({
    required: false,
    type: PublicMetaDto,
    description: 'Pagination metadata (only for list endpoints)',
  })
  meta?: PublicMetaDto;
}

export class PublicListResponseDto extends PublicContentResponseDto {
  @ApiProperty({
    type: [Object],
    description: 'Array of content entries',
  })
  data: any[];

  @ApiProperty({
    type: PublicMetaDto,
    description: 'Pagination metadata',
  })
  meta: PublicMetaDto;
}
