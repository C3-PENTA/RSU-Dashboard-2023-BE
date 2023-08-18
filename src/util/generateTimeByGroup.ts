import { groupByNodeId } from "./groupByNodeId";

export const generateTimeByGroup = (records) => {
  const groups = groupByNodeId(records);
  let offset = 1;

  for (const group of groups) {
    let time = new Date(); // Create a new Date object for each group
    
    for (const event of group) {
      event.created_at = new Date(time); // Create a new Date object for each event
      event.created_at.setMinutes(event.created_at.getMinutes() + offset);
    }

    offset += 1;
  }
  return groups.flat();
};
