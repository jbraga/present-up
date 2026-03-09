import { DataService } from '@core/services/dataService';

import { SearchStudentInput, UpsertStudentInput } from '@features/students/types/student';

export class StudentService {
  constructor(private readonly dataService: DataService) {}

  searchStudents(input: SearchStudentInput) {
    return this.dataService.fetchStudentsByQuery(input.query, input.limit, input.offset);
  }

  upsertStudent(input: UpsertStudentInput) {
    return this.dataService.upsertStudent(input);
  }

  fetchStudentsByIds(studentIds: string[]) {
    return this.dataService.fetchStudentsByIds(studentIds);
  }

  deleteStudents(studentIds: string[]) {
    return this.dataService.deleteStudents(studentIds);
  }
}
