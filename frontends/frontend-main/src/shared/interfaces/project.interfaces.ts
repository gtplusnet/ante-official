/**
 * Project interfaces - Re-export from backend shared types plus UI extensions
 * This file will be deprecated - use @shared/response directly
 */

// Import all project-related interfaces from backend shared types
import type {
  ProjectDataResponse as ProjectInterface,
  LocationDataResponse as LocationDataInterface,
  ClientDataResponse as ClientDataInterface,
  CompanyDataResponse as CompanyDataInterface,
  BOQDataResponse as BOQDataInterface,
  DateFormat,
  CurrencyFormat,
  ProjectStatus
} from "@shared/response";

// Re-export for backward compatibility
export type {
  ProjectInterface,
  LocationDataInterface,
  ClientDataInterface,
  CompanyDataInterface,
  BOQDataInterface,
  DateFormat,
  CurrencyFormat,
  ProjectStatus
};

/**
 * Interface for Project list response with additional UI properties
 */
export interface ProjectWithUIProps extends ProjectInterface {
  // Add any frontend-specific UI properties here
  uiExpanded?: boolean;
  uiSelected?: boolean;
  uiTags?: string[];
}

/**
 * Interface for combined Project response from the API
 */
export interface ProjectListResponseInterface {
  items: ProjectInterface[];
  total: number;
  timestamp: string;
}

/**
 * Interface for combined Project response including UI properties
 */
export interface CombinedProjectResponseInterface {
  items: ProjectWithUIProps[];
  total: number;
  timestamp: string;
}

