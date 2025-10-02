import cronstrue from 'cronstrue';

export function getCronDescription(cronExpression: string): string {
  try {
    // Use cronstrue to get a human-readable description
    return cronstrue.toString(cronExpression, {
      use24HourTimeFormat: false,
      verbose: true,
    });
  } catch (error) {
    // If parsing fails, return the original expression
    return cronExpression;
  }
}