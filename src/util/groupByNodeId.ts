export const groupByNodeId = (events) => {
  const groups = [];
  let group = [];
  const nodeIdsSet = new Set();

  for (const event of events) {
    const nodeId = event.node_id;
    if (nodeIdsSet.has(nodeId)) {
      groups.push(group);
      group = [event];
      nodeIdsSet.clear(); // Clear the Set to track new node IDs for the next group
      nodeIdsSet.add(nodeId);
    } else {
      nodeIdsSet.add(nodeId);
      group.push(event);
    }
  }
  if (group.length !== 0) groups.push(group);

  return groups;
};
