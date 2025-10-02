import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Module,
  Injectable,
} from '@nestjs/common';
import { ApiTestHelper, assertSuccessResponse } from './test-helpers';

// Example service for testing
@Injectable()
class ExampleService {
  private items = [];

  create(data: any) {
    const item = { id: Date.now().toString(), ...data };
    this.items.push(item);
    return item;
  }

  findAll() {
    return this.items;
  }

  findOne(id: string) {
    const item = this.items.find((item) => item.id === id);
    if (!item) {
      throw new Error('Item not found');
    }
    return item;
  }
}

// Example controller for testing
@Controller('example')
class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post()
  create(@Body() createDto: any) {
    return {
      success: true,
      data: this.exampleService.create(createDto),
    };
  }

  @Get()
  findAll() {
    return {
      success: true,
      data: this.exampleService.findAll(),
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return {
        success: true,
        data: this.exampleService.findOne(id),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}

// Example module
@Module({
  controllers: [ExampleController],
  providers: [ExampleService],
})
class ExampleModule {}

describe('Example API Tests', () => {
  let testHelper: ApiTestHelper;

  beforeAll(async () => {
    testHelper = new ApiTestHelper();
    await testHelper.initialize([ExampleModule]);
  });

  afterAll(async () => {
    await testHelper.close();
  });

  describe('POST /example', () => {
    it('should create a new item', async () => {
      const data = { name: 'Test Item', value: 42 };
      const response = await testHelper.post('/example', data);

      assertSuccessResponse(response);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(data.name);
      expect(response.body.data.value).toBe(data.value);
    });
  });

  describe('GET /example', () => {
    it('should return all items', async () => {
      // Create some test data first
      await testHelper.post('/example', { name: 'Item 1' });
      await testHelper.post('/example', { name: 'Item 2' });

      const response = await testHelper.get('/example');

      assertSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /example/:id', () => {
    it('should return item by id', async () => {
      // Create an item
      const createResponse = await testHelper.post('/example', {
        name: 'Find Me',
      });
      const itemId = createResponse.body.data.id;

      const response = await testHelper.get(`/example/${itemId}`);

      assertSuccessResponse(response);
      expect(response.body.data.id).toBe(itemId);
      expect(response.body.data.name).toBe('Find Me');
    });

    it('should return error for non-existent id', async () => {
      const response = await testHelper.get('/example/non-existent');

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Item not found');
    });
  });
});
