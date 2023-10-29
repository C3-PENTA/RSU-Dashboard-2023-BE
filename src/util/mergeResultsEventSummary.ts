import { SummaryItemInf } from '@interface/event.interface';

export const mergeResults = (
  availabilityNormalEvents: SummaryItemInf[],
  availabilityErrorEvents: SummaryItemInf[],
  communicationNormalEvents: SummaryItemInf[],
  communicationErrorEvents: SummaryItemInf[],
): SummaryItemInf[] => {
  const mergedResults: Record<string, SummaryItemInf> = {}; // Updated type to SummaryItemRes

  const mergeEvent = (item: SummaryItemInf, eventType: string) => {
    const { nodeId } = item;
    if (!mergedResults[nodeId]) {
      mergedResults[nodeId] = { nodeId: nodeId }; // Updated property name
    }

    mergedResults[nodeId]['customId'] = item['customId'] || 0; // Updated property name
    mergedResults[nodeId][`total${eventType}`] = item[`total${eventType}`] || 0; // Updated property name
  };

  const events = [
    ...availabilityNormalEvents.map((item) => ({ ...item, eventType: 'AvailabilityNormal' })),
    ...availabilityErrorEvents.map((item) => ({ ...item, eventType: 'AvailabilityError' })),
    ...communicationNormalEvents.map((item) => ({ ...item, eventType: 'CommunicationNormal' })),
    ...communicationErrorEvents.map((item) => ({ ...item, eventType: 'CommunicationError' })),
  ];

  events.forEach((item) => mergeEvent(item, item.eventType));

  Object.values(mergedResults).forEach((result) => {
    result.totalAvailabilityNormal = result.totalAvailabilityNormal ? +result.totalAvailabilityNormal : 0;
    result.totalAvailabilityError= result.totalAvailabilityError ? +result.totalAvailabilityError : 0;
    result.totalCommunicationNormal= result.totalCommunicationNormal ? +result.totalCommunicationNormal : 0;
    result.totalCommunicationError = result.totalCommunicationError ? +result.totalCommunicationError : 0;

    result.percentAvailabilityError = Math.round(result.totalAvailabilityError * 100 / (result.totalAvailabilityError + result.totalAvailabilityNormal));
    result.percentAvailabilityNormal = 100 - result.percentAvailabilityError;
    result.percentCommunicationError = Math.round(result.totalCommunicationError * 100 / (result.totalCommunicationError + result.totalCommunicationNormal));
    result.percentCommunicationNormal = 100 - result.percentCommunicationError;
    result.percentTotalAvailability = 100;
    result.percentTotalCommunication = 100;

    if (result.totalAvailabilityNormal + result.totalAvailabilityError == 0) {
      result.percentAvailabilityError = '-';
      result.percentAvailabilityNormal = '-';
      result.percentTotalAvailability = '-';
    }
    if (result.totalCommunicationNormal + result.totalCommunicationError == 0) {
      result.percentCommunicationError = '-';
      result.percentCommunicationNormal = '-';
      result.percentTotalCommunication = '-';
    }

  });

  // Return the merged results
  return Object.values(mergedResults);
};
