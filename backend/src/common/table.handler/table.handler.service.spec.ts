import { Test, TestingModule } from '@nestjs/testing';
import { TableHandlerService } from './table.handler.service';
import { UtilityService } from '@common/utility.service';
import { TableBodyDTO, TableQueryDTO } from '@common/table.dto/table.dto';

describe('TableHandlerService', () => {
  let service: TableHandlerService;
  let _utilityService: jest.Mocked<UtilityService>;

  const mockUtilityService = {
    accountInformation: {
      id: 'test-user-id',
      companyId: 'test-company-id',
    },
    companyId: 'test-company-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TableHandlerService,
        { provide: UtilityService, useValue: mockUtilityService },
      ],
    }).compile();

    service = module.get<TableHandlerService>(TableHandlerService);
    _utilityService = module.get(UtilityService);
  });

  describe('initialize', () => {
    it('should initialize table handler with query, body and table reference key', () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [],
        },
      };

      service.initialize(query, body, 'test-table');

      // Verify private properties are set (accessing via any to test private properties)
      expect((service as any).query).toEqual(query);
      expect((service as any).body).toEqual(body);
      expect((service as any).tableInformation).toEqual(body.settings);
    });

    it('should handle body without settings', () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };

      service.initialize(query, body, 'test-table');

      expect((service as any).query).toEqual(query);
      expect((service as any).body).toEqual(body);
      expect((service as any).tableInformation).toEqual({});
    });
  });

  describe('constructTableQuery', () => {
    beforeEach(() => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [],
        },
      };
      service.initialize(query, body, 'test-table');
    });

    it('should construct basic table query with default values', () => {
      const result = service.constructTableQuery();

      expect(result).toHaveProperty('take', 10);
      expect(result).toHaveProperty('skip', 0);
      expect(result).toHaveProperty('orderBy');
      expect(result).toHaveProperty('where');
      expect(result.orderBy).toHaveProperty('createdAt', 'desc');
    });

    it('should handle missing page and perPage in query', () => {
      const query: any = {};
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'id',
          defaultOrderType: 'asc',
          sort: [],
          filter: [],
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.take).toBe(10); // default perPage
      expect(result.skip).toBe(0); // page 1 default
      expect(result.orderBy).toHaveProperty('id', 'asc');
    });

    it('should calculate skip correctly for pagination', () => {
      const query: TableQueryDTO = { page: 3, perPage: 20 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [],
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.take).toBe(20);
      expect(result.skip).toBe(40); // (3 * 20) - 20 = 40
    });

    it('should handle custom sort from query', () => {
      const query: any = {
        page: 1,
        perPage: 10,
        sort: 'name',
        sortType: 'asc',
      };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [{ key: 'name', column: 'firstName' }],
          filter: [],
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.orderBy).toHaveProperty('firstName', 'asc');
    });

    it('should use default order when custom sort is not found', () => {
      const query: any = { page: 1, perPage: 10, sort: 'nonexistent' };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [{ key: 'name', column: 'firstName' }],
          filter: [],
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.orderBy).toHaveProperty('createdAt', 'desc');
    });

    it('should handle missing tableInformation', () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {},
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.take).toBe(10);
      expect(result.skip).toBe(0);
      expect(result.orderBy).toBeDefined();
    });

    it('should ensure filter and sort are arrays when they are not', () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: null as any,
          filter: null as any,
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result).toBeDefined();
      expect((service as any).tableInformation.sort).toEqual([]);
      expect((service as any).tableInformation.filter).toEqual([]);
    });

    it('should handle filters in body', () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [{ status: 'active' }],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [{ key: 'status', column: 'status', isNumber: false }],
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.where).toHaveProperty('status', 'active');
    });

    it('should handle nested column filters', () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [{ roleName: 'admin' }],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [{ key: 'roleName', column: 'role.name', isNumber: false }],
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.where).toHaveProperty('role');
      expect((result.where as any).role).toHaveProperty('name', 'admin');
    });

    it('should handle number filters', () => {
      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [{ age: '25' }],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [{ key: 'age', column: 'age', isNumber: true }],
        },
      };
      service.initialize(query, body, 'test-table');

      const result = service.constructTableQuery();

      expect(result.where).toHaveProperty('age', 25);
    });
  });

  describe('getTableData', () => {
    let mockModel: any;

    beforeEach(() => {
      mockModel = {
        findMany: jest.fn(),
        count: jest.fn(),
      };

      const query: TableQueryDTO = { page: 1, perPage: 10 };
      const body: TableBodyDTO = {
        filters: [],
        settings: {
          defaultOrderBy: 'createdAt',
          defaultOrderType: 'desc',
          sort: [],
          filter: [],
        },
      };
      service.initialize(query, body, 'test-table');
    });

    it('should return table data with pagination', async () => {
      const mockData = [
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
      ];
      const totalCount = 25;

      mockModel.findMany.mockResolvedValue(mockData);
      mockModel.count.mockResolvedValue(totalCount);

      const tableQuery = {
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        where: {},
      };

      const result = await service.getTableData(
        mockModel,
        { page: 1, perPage: 10 },
        tableQuery,
      );

      expect(mockModel.findMany).toHaveBeenCalledWith(tableQuery);
      expect(mockModel.count).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        where: {},
      });
      expect(result).toHaveProperty('list', mockData);
      expect(result).toHaveProperty('currentPage', 1);
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toBeInstanceOf(Array);
    });

    it('should handle empty result set', async () => {
      mockModel.findMany.mockResolvedValue([]);
      mockModel.count.mockResolvedValue(0);

      const tableQuery = {
        take: 10,
        skip: 0,
        orderBy: { createdAt: 'desc' },
        where: {},
      };

      const result = await service.getTableData(
        mockModel,
        { page: 1, perPage: 10 },
        tableQuery,
      );

      expect(result.list).toEqual([]);
      expect(result.currentPage).toBe(1);
      expect(result.pagination).toBeInstanceOf(Array);
    });
  });

  describe('range', () => {
    it('should generate range of numbers from start to end inclusive', () => {
      const result = service.range(1, 5);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle single number range', () => {
      const result = service.range(3, 3);
      expect(result).toEqual([3]);
    });

    it('should handle empty range when start > end', () => {
      const result = service.range(5, 3);
      expect(result).toEqual([]);
    });
  });

  describe('paginate', () => {
    it('should return simple range when total pages fit within page numbers', () => {
      const result = service.paginate(50, 10, 1, 3); // 5 total pages
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle single page', () => {
      const result = service.paginate(5, 10, 1, 1); // 1 total page
      expect(result).toEqual([1]);
    });

    it('should show right dots when at beginning of large dataset', () => {
      const result = service.paginate(100, 10, 1, 2); // 10 total pages, current page 2
      expect(result).toContain('...');
      expect(result).toContain(10); // last page
    });

    it('should show left dots when at end of large dataset', () => {
      const result = service.paginate(100, 10, 1, 9); // 10 total pages, current page 9
      expect(result).toContain('...');
      expect(result).toContain(1); // first page
    });

    it('should show both dots when in middle of large dataset', () => {
      const result = service.paginate(200, 10, 1, 10); // 20 total pages, current page 10
      expect(result.filter((item) => item === '...')).toHaveLength(2);
      expect(result).toContain(1); // first page
      expect(result).toContain(20); // last page
    });

    it('should handle edge case with minimal pages', () => {
      const result = service.paginate(10, 10, 1, 1); // 1 total page
      expect(result).toEqual([1]);
    });

    it('should handle current page at boundaries', () => {
      const result1 = service.paginate(100, 10, 1, 1); // first page
      const result2 = service.paginate(100, 10, 1, 10); // last page

      expect(result1).toContain(1);
      expect(result2).toContain(10);
    });
  });
});
