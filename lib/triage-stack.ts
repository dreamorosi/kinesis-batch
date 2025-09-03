import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from 'aws-cdk-lib';
import { Stream } from 'aws-cdk-lib/aws-kinesis';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { KinesisEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { Construct } from 'constructs';

export class TriageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fnName = 'TriageFn';
    const logGroup = new LogGroup(this, 'MyLogGroup', {
      logGroupName: `/aws/lambda/${fnName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_DAY,
    });
    const fn = new NodejsFunction(this, 'MyFunction', {
      functionName: fnName,
      logGroup,
      runtime: Runtime.NODEJS_22_X,
      entry: './src/index.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        mainFields: ['module', 'main'],
        sourceMap: true,
        format: OutputFormat.ESM,
      },
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    const kStream = new Stream(this, 'Kinesis-Stream', {
      streamName: 'KinesisLambda-Stream',
      retentionPeriod: Duration.days(7),
      shardCount: 1,
    });

    fn.addEventSource(
      new KinesisEventSource(kStream, {
        startingPosition: StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        maxBatchingWindow: Duration.seconds(1),
        bisectBatchOnError: false,
        retryAttempts: 0,
        maxRecordAge: Duration.seconds(120),
        enabled: true,
        parallelizationFactor: 1,
        reportBatchItemFailures: true,
      })
    );

    new CfnOutput(this, 'FunctionArn', {
      value: fn.functionArn,
    });

    new CfnOutput(this, 'KinesisStreamName', {
      value: kStream.streamName,
    });
  }
}
