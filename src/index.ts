import {
  BatchProcessor,
  EventType,
  processPartialResponse,
} from '@aws-lambda-powertools/batch';
import { Logger } from '@aws-lambda-powertools/logger';
// import { KinesisDataStreamRecordPayload, KinesisDataStreamSchema } from '@aws-lambda-powertools/parser/schemas/kinesis';
import type { Context, KinesisStreamEvent } from 'aws-lambda';

const processor = new BatchProcessor(EventType.KinesisDataStreams);
const logger = new Logger();

const recordHandler = async (item: KinesisStreamEvent['Records'][number]) => {
  logger.info(`Processing record: ${item.kinesis.sequenceNumber}`, {
    data: item.kinesis.data,
  });
};

export const handler = async (event: KinesisStreamEvent, context: Context) => {
  logger.logEventIfEnabled(event, true);
  return processPartialResponse(event, recordHandler, processor, { context });
};
