import * as moment from 'moment-timezone';
import * as fs from 'fs';

const getUnixCurrentTime = () => {
  return Math.floor(new Date().getTime() / 1000);
}

const convertUnixToFormat = (timestamp: number) => {
  return moment(
    moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ssZ'),
  ).toDate();
};

const convertTimeZone = (timestamp: string) => {
  return moment.utc(timestamp).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ssZ');
};

const convertToUTC = (timestamp: string) => {
  // Parse the timestamp with the provided time zone offset
  const localDate = moment(timestamp, 'YYYY-MM-DD HH:mm:ssZ');

  // Convert to UTC time
  const utcDate = localDate.utc();

  return utcDate;
};

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min));
};

const randomChoice = <T>(array: T[]): T => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};

const checkExistFolder = (checkPath: string) => {
  !fs.existsSync(checkPath) && fs.mkdir(checkPath, (err) => err);
};

export {
  getUnixCurrentTime,
  convertUnixToFormat,
  convertTimeZone,
  convertToUTC,
  shuffleArray,
  randomChoice,
  randomNumber,
  checkExistFolder,
};
