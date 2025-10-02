import { Injectable, Inject } from '@nestjs/common';
import { TableBodyDTO, TableQueryDTO } from '../../lib/table.dto/table.dto';
import { UtilityService } from '../../lib/utility.service';
import { TableResponse } from '../../shared/response';

@Injectable()
export class TableHandlerService {
  private query;
  private body;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tableInformation: any;
  private siblingsPage = 2;

  @Inject() private utility: UtilityService;

  initialize(query: TableQueryDTO, body: TableBodyDTO) {
    this.query = query;
    this.body = body;
    this.tableInformation = body.settings;
  }
  constructTableQuery() {
    // Validate and set default values
    if (!this.query.hasOwnProperty('page')) this.query.page = 1;
    if (!this.query.hasOwnProperty('perPage')) this.query.perPage = 10;

    const currentPage = Math.max(1, Number(this.query.page) || 1);
    const take = Math.max(1, Math.min(100, Number(this.query.perPage) || 10)); // Limit to max 100 per page

    // Validate and initialize table information
    if (!this.tableInformation || typeof this.tableInformation !== 'object') {
      this.tableInformation = {
        defaultOrderBy: 'createdAt',
        defaultOrderType: 'desc',
        sort: [],
        filter: [],
      };
    }

    // Ensure required properties exist and are valid
    if (
      !this.tableInformation.defaultOrderBy ||
      typeof this.tableInformation.defaultOrderBy !== 'string'
    ) {
      this.tableInformation.defaultOrderBy = 'createdAt';
    }
    if (
      !this.tableInformation.defaultOrderType ||
      !['asc', 'desc'].includes(this.tableInformation.defaultOrderType)
    ) {
      this.tableInformation.defaultOrderType = 'desc';
    }
    if (!Array.isArray(this.tableInformation.filter)) {
      this.tableInformation.filter = [];
    }
    if (!Array.isArray(this.tableInformation.sort)) {
      this.tableInformation.sort = [];
    }

    const defaultOrderType = this.tableInformation.defaultOrderType || 'asc';
    const sortType =
      this.query.hasOwnProperty('sortType') &&
      ['asc', 'desc'].includes(this.query.sortType)
        ? this.query.sortType
        : defaultOrderType;

    let orderBy = {};
    const orderByColumn = this.tableInformation.defaultOrderBy || 'createdAt';
    orderBy[orderByColumn] = sortType;

    if (this.query.hasOwnProperty('sort') && this.query.sort) {
      const customOrderBy = this.tableInformation.sort.find(
        (sort) => sort.key == this.query.sort,
      );

      if (customOrderBy && customOrderBy.column) {
        orderBy = {};
        orderBy[customOrderBy.column] = sortType;
      }
    }

    let skip = 0;
    skip = currentPage * take - take;

    let where = {};
    if (this.body.hasOwnProperty('filters')) {
      this.body.filters.forEach((filter) => {
        for (const filterKey in filter) {
          const customFilter = this.tableInformation.filter.find(
            (refFilter) => refFilter.key == filterKey,
          );

          if (customFilter) {
            if (customFilter.column.includes('.')) {
              const relations = customFilter.column.split('.');
              const lastColumn = relations.pop();
              const nestedWhere = {};
              let currentLevel = nestedWhere;

              for (let i = 0; i < relations.length; i++) {
                currentLevel[relations[i]] = {};
                currentLevel = currentLevel[relations[i]];
              }

              currentLevel[lastColumn] = filter[filterKey];
              where = { ...where, ...nestedWhere };
            } else {
              if (
                customFilter.hasOwnProperty('isNumber') &&
                customFilter.isNumber
              ) {
                filter[filterKey] = Number(filter[filterKey]);
              }

              if (Array.isArray(filter[filterKey])) {
                where[customFilter.column] = {
                  in: filter[filterKey],
                };
              } else {
                where[customFilter.column] = filter[filterKey];
              }
            }
          }
        }
      });
    }

    if (this.body.hasOwnProperty('searchKeyword') && this.body.searchKeyword) {
      const searchKeyword = this.body.searchKeyword;
      const searchColumn = this.body.searchBy;

      if (searchColumn.includes('.')) {
        const [relation, column] = searchColumn.split('.');
        where[relation] = {
          [column]: {
            contains: searchKeyword,
            mode: 'insensitive',
          },
        };
      } else {
        where[searchColumn] = {
          contains: searchKeyword,
          mode: 'insensitive',
        };
      }
    }

    return { take, orderBy, skip, where };
  }
  async getTableData<T>(model, query, tableQuery): Promise<TableResponse<T>> {
    const tableData: T[] = await model.findMany(tableQuery);
    const perPage = tableQuery.take;
    const currentPage = Number(query.page);
    delete tableQuery.take;
    delete tableQuery.skip;
    delete tableQuery.include;
    delete tableQuery.relationLoadStrategy;
    const totalCount: number = await model.count(tableQuery);
    const pagination: number[] = this.paginate(
      totalCount,
      perPage,
      this.siblingsPage,
      currentPage,
    );
    return {
      list: tableData,
      pagination,
      currentPage: currentPage,
      totalCount,
    };
  }

  range(start, end) {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  }
  paginate(
    totalCount: number,
    pageSize: number,
    siblingCount: number,
    currentPage: number,
  ) {
    const DOTS = '...';
    const totalPageCount = Math.ceil(totalCount / pageSize);
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPageCount) {
      return this.range(1, totalPageCount);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount,
    );

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = this.range(1, leftItemCount);

      return [...leftRange, DOTS, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = this.range(
        totalPageCount - rightItemCount + 1,
        totalPageCount,
      );
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = this.range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }
  }
}
