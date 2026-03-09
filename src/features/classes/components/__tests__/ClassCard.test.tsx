import { render } from '@testing-library/react-native';

import type { ClassEntity } from '../../types/class';
import { ClassCard } from '../ClassCard';

const mockClass: ClassEntity = {
  id: 'class_123',
  name: 'Football U12',
  instructorEmail: 'instructor@example.com',
  instructorName: 'Jordan Smith',
  minAttendancePercentage: 0.5,
  schedule: [{ dayOfWeek: 'Monday', startTime: '15:00', endTime: '16:30' }],
  capacity: 18,
  location: 'Main Field',
  iconName: 'soccer',
  imageUri: '',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-02-01'),
};

describe('ClassCard', () => {
  it('renders class information', () => {
    const { getByText } = render(<ClassCard item={mockClass} />);

    expect(getByText('Football U12')).toBeTruthy();
    expect(getByText('Jordan Smith')).toBeTruthy();
    expect(getByText('Main Field')).toBeTruthy();
  });
});
