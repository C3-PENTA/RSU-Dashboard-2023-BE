import { Event_Key } from "src/constants";

export const isValidHeader = (record: Record<string, any>) => {
  const requiredKeysSet1 = new Set([
    Event_Key.OCCURRENCE_TIME,
    Event_Key.NODE_ID,
    Event_Key.CPU_USAGE,
    Event_Key.CPU_TEMPERATURE,
    Event_Key.RAM_USAGE,
    Event_Key.DISK_USAGE,
    Event_Key.NETWORK_SPEED,
    Event_Key.NETWORK_USAGE,
    Event_Key.NETWORK_CONNECTION_STATUS
  ]);

  const requiredKeysSet2 = new Set([
    Event_Key.OCCURRENCE_TIME,
    Event_Key.NODE_ID,
    Event_Key.SRC_NODE,
    Event_Key.DEST_NODE,
    Event_Key.DRIVING_NEGOTIATION_CLASS,
    Event_Key.METHOD,
    Event_Key.MESSAGE_TYPE
  ]);

  const keysSet = new Set(Object.keys(record))
  const validAvailabilityEventHeader =
    keysSet.size === requiredKeysSet1.size &&
    [...requiredKeysSet1].every((key) => keysSet.has(key));

  const validCommunicationEventHeader =
    keysSet.size === requiredKeysSet2.size &&
    [...requiredKeysSet2].every((key) => keysSet.has(key));

  if (validAvailabilityEventHeader) return 1;
  if (validCommunicationEventHeader) return 2;
  return 0;
};

export const isValidInformation = (record: Record<string, any>, typeEvent: number) => {
  if (typeEvent == 1) {
    const cpuUsage = parseFloat(record[Event_Key.CPU_USAGE]);
    const ramUsage = parseFloat(record[Event_Key.RAM_USAGE]);
    const diskUsage = parseFloat(record[Event_Key.DISK_USAGE]);
    const networkStatus = record[Event_Key.NETWORK_CONNECTION_STATUS];
    const networkUsage = parseFloat(record[Event_Key.NETWORK_USAGE]);
  
    if (cpuUsage < 0 || cpuUsage > 100) return false;
    if (ramUsage < 0 || ramUsage > 100) return false;
    if (diskUsage < 0 || diskUsage > 100) return false;
    // if (networkStatus !== '연결이 끊긴' && networkStatus !== '연결된') return false;
    if (networkUsage < 0) return false;
    return true;
  } else {
    return true;
  }
};
