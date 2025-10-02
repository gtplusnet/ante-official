import { CollaboratorInterface } from './collaborator.interface';
import { BoardLaneInterface } from './boardLane.interface';

export interface TaskInterface {
  id: number;
  title: string;
  description: string;
  createdById: string;
  projectId: number;
  boardLaneId: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
  updatedById: string;
  isDeleted: boolean;
  assignedToId?: string;
  isRead: boolean;
  boardLane?: BoardLaneInterface;
}

export interface ProjectOfTaskInterface {
  id: number;
  name: string;
  description: string;
  budget: number;
  clientId: number;
  startDate: Date;
  endDate: Date;
  status: string;
  isDeleted: boolean;
}

export interface CombinedTaskResponseInterface {
  task?: TaskInterface;
  collaborators?: CollaboratorInterface[];
  projectInformation?: ProjectOfTaskInterface;
}
