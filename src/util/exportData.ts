import * as json2csv from 'json2csv';
import * as archiver from 'archiver';
import { Response } from 'express';

export const exportDataToZip = (res: Response, data: any) => {
	const time = new Date().getTime();
  const filename = `${time}.zip`;
  const batchSize = 6 * 60 * 24 * 50;
  const totalRecords = data.length;
  let startIndex = 0;
  let endIndex = Math.min(startIndex + batchSize, totalRecords);

  // Create a zip archive
  const archive = archiver('zip');

  // Set the response headers for zip file download
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  archive.pipe(res);

  while (startIndex < totalRecords) {
    const timestamp = new Date().getTime();
    const batch = data.slice(startIndex, endIndex);
    const csv = json2csv.parse(batch, { withBOM: true });
    const csvFilename = `data_${timestamp}_${startIndex + 1}-${endIndex}.csv`;

    // Add the CSV file to the zip archive
    archive.append(csv, { name: csvFilename });

    startIndex += batchSize;
    endIndex = Math.min(startIndex + batchSize, totalRecords);
  }

  // Finalize the zip archive
  archive.finalize();
};


export const exportDataToCSV = (res: Response, data: any) => {
	const time = new Date().getTime();
  const filename = `${time}.csv`;


  // Set the response headers for CSV file download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const csv = json2csv.parse(data, { withBOM: true });
	
	// Send the CSV content as response
	res.write(csv);

  // End the response
  res.end();
};
