import * as moment from 'moment-timezone';

export const convertTimeZone = (timestamp: string) => {
  return moment.utc(timestamp).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ssZ');
};


export const convertToUTC = (timestamp: string) => {
  // Parse the timestamp with the provided time zone offset
  const localDate = moment(timestamp, 'YYYY-MM-DD HH:mm:ssZ');
  
  // Convert to UTC time
  const utcDate = localDate.utc();

  return utcDate;
};
