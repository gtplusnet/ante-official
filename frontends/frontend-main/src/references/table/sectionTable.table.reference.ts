export default {
  columns: [
    {
      key: 'name',
      label: 'Section Name',
      class: 'text-left',
    },
    {
      key: 'gradeLevel',
      label: 'Grade Level',
      class: 'text-left',
      slot: 'gradeLevel',
    },
    {
      key: 'adviserName',
      label: 'Adviser',
      class: 'text-left',
    },
    {
      key: 'schoolYear',
      label: 'School Year',
      class: 'text-center',
    },
    {
      key: 'capacity',
      label: 'Capacity',
      class: 'text-center',
      slot: 'capacity',
    },
    {
      key: 'isActive',
      label: 'Status',
      class: 'text-center',
      slot: 'status',
    },
  ],
  search: [
    {
      key: 'name',
      label: 'Section Name',
    },
    {
      key: 'adviserName',
      label: 'Adviser Name',
    },
    {
      key: 'schoolYear',
      label: 'School Year',
    },
  ],
  filter: [],
  perPage: 10,
};