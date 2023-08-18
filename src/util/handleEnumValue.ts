export const getEnumValue = <T extends { [K in keyof T]: number | string }>(
  enumObject: T,
  input: string,
): T[keyof T] | undefined => {
  const matchingKey = Object.keys(enumObject).find(
    (key) =>
      key.replace(/\s/g, '').toLowerCase() ===
      input.replace(/\s/g, '').toLowerCase(),
  );

  return matchingKey ? enumObject[matchingKey as keyof T] : undefined;
};

export const enumToKeyValue = <T extends Record<keyof T, number | string>>(
  enumObject: T,
) => {
  return Object.keys(enumObject).reduce((acc, key) => {
    const enumKey = key as keyof T;
    const enumValue = enumObject[enumKey];
    if (typeof enumValue === 'number') {
      acc[enumKey] = enumValue;
    }
    return acc;
  }, {} as Record<keyof T, number>);
};
