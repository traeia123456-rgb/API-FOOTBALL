/**
 * Export utilities for downloading data in various formats
 */

/**
 * Download data as JSON file
 */
export function downloadJSON(data: any, filename: string = 'data') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download data as CSV file
 */
export function downloadCSV(data: any, filename: string = 'data') {
  let csvData: any[] = [];

  // Handle different data structures
  if (data.response && Array.isArray(data.response)) {
    // API Football format
    csvData = flattenData(data.response);
  } else if (Array.isArray(data)) {
    csvData = flattenData(data);
  } else {
    csvData = [data];
  }

  const csvString = convertToCSV(csvData);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Flatten nested objects for CSV export
 */
function flattenData(data: any[]): any[] {
  return data.map(item => flattenObject(item));
}

/**
 * Flatten a single object
 */
function flattenObject(obj: any, prefix: string = ''): any {
  const flattened: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively flatten nested objects
        Object.assign(flattened, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        // Convert arrays to strings
        flattened[newKey] = value.join('; ');
      } else {
        flattened[newKey] = value;
      }
    }
  }
  
  return flattened;
}

/**
 * Download data as Excel file (XLSX)
 * Uses a simple approach without external libraries
 */
export function downloadExcel(data: any, filename: string = 'data') {
  let tableData: any[] = [];

  // Handle different data structures
  if (data.response && Array.isArray(data.response)) {
    tableData = flattenData(data.response);
  } else if (Array.isArray(data)) {
    tableData = flattenData(data);
  } else {
    tableData = [data];
  }

  if (tableData.length === 0) {
    console.error('No data to export');
    return;
  }

  // Create HTML table
  const headers = Object.keys(tableData[0]);
  let html = '<table><thead><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  tableData.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      html += `<td>${row[header] !== undefined ? row[header] : ''}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';

  // Create Excel file using data URI
  const uri = 'data:application/vnd.ms-excel;base64,';
  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:x="urn:schemas-microsoft-com:office:excel" 
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Data</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>${html}</body>
    </html>
  `;

  const base64 = btoa(unescape(encodeURIComponent(template)));
  const link = document.createElement('a');
  link.href = uri + base64;
  link.download = `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate filename based on intent and timestamp
 */
export function generateFilename(intent: string): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const intentMap: Record<string, string> = {
    'fixtures': 'partidos',
    'standings': 'clasificacion',
    'topscorers': 'goleadores',
    'player_stats': 'jugador',
    'live': 'en_vivo'
  };
  
  const name = intentMap[intent] || 'datos';
  return `${name}_${timestamp}`;
}
