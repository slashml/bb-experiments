import Papa from 'papaparse';
import { Profile } from './types';

export function parseCSV(file: File): Promise<Profile[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (!results.data || results.data.length === 0) {
            reject(new Error('No data found in CSV file.'));
            return;
          }

          const firstRow = results.data[0] as any;
          const headers = Object.keys(firstRow);
          
          // Find LinkedIn URL column - could be first column or have various names
          const linkedinColumn = headers.find(header => 
            header.toLowerCase().includes('linkedin') || 
            header.toLowerCase().includes('url') ||
            header.toLowerCase().includes('profile') ||
            (headers.indexOf(header) === 0) // First column as fallback
          );

          // Find name column - look for name-related headers or use second column
          const nameColumn = headers.find(header => 
            header.toLowerCase().includes('name') ||
            header.toLowerCase().includes('full') ||
            header.toLowerCase().includes('first') ||
            (headers.indexOf(header) === 1 && !header.toLowerCase().includes('linkedin')) // Second column as fallback
          ) || headers[1]; // Use second column if no name column found

          const profiles: Profile[] = results.data.map((row: any) => {
            const linkedinUrl = linkedinColumn ? row[linkedinColumn]?.trim() || '' : '';
            const name = nameColumn ? row[nameColumn]?.trim() || '' : '';
            
            return {
              name,
              linkedin_url: linkedinUrl
            };
          }).filter(profile => profile.linkedin_url); // Only require LinkedIn URL

          if (profiles.length === 0) {
            reject(new Error('No valid profiles found. Please ensure your CSV has at least one column with LinkedIn URLs.'));
            return;
          }

          if (profiles.length > 10) {
            reject(new Error('Maximum 10 profiles allowed for MVP demo.'));
            return;
          }

          resolve(profiles);
        } catch (error) {
          reject(new Error('Failed to parse CSV file.'));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}