import { DataService } from '@core/services/dataService';

import { CreateClassInput } from '@features/classes/types/class';

export class ClassService {
  constructor(private readonly dataService: DataService) {}

  getClasses(instructorEmail: string) {
    return this.dataService.fetchClasses(instructorEmail);
  }

  createClass(input: CreateClassInput) {
    return this.dataService.createClass(input);
  }

  updateClass(
    classId: string,
    name: string,
    instructorName: string,
    schedule: { dayOfWeek: string; startTime: string; endTime: string }[],
    capacity: number,
    minAttendancePercentage: number,
    location?: string,
    iconName?: string,
    imageUri?: string
  ) {
    return this.dataService.updateClass(classId, name, instructorName, schedule, capacity, minAttendancePercentage, location, iconName, imageUri);
  }

  assignStudentToClass(classId: string, studentId: string) {
    return this.dataService.assignStudentToClass(classId, studentId);
  }

  unassignStudentFromClass(classId: string, studentId: string) {
    return this.dataService.unassignStudentFromClass(classId, studentId);
  }

  getClassRoster(classId: string) {
    return this.dataService.fetchClassRoster(classId);
  }

  deleteClasses(classIds: string[]) {
    return this.dataService.deleteClasses(classIds);
  }
}
