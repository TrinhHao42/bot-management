import { createHash } from 'crypto';

/**
 * Generate a unique SHA-256 hash for a job entry to check for duplicates.
 * @param title Job Title
 * @param company Company Name
 * @param locationOrSalary Can be location or salary string to help disambiguate
 * @returns SHA-256 HEX string
 */
export function generateJobHash(title: string, company: string, locationOrSalary: string): string {
  const payload = `${title}|${company}|${locationOrSalary}`.toLowerCase().trim();
  return createHash('sha256').update(payload).digest('hex');
}
