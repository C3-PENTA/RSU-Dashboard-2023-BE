export const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min));
};

export const randomChoice = <T>(array: T[]): T => {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
};