import { Module } from '@nestjs/common';
import { GreenhouseConnector } from './greenhouse.connector.js';
import { LeverConnector } from './lever.connector.js';
import { SeedJobConnector } from './seed.connector.js';
import { JobConnector } from './connector.interface.js';

@Module({
  providers: [
    GreenhouseConnector,
    LeverConnector,
    SeedJobConnector,
    {
      provide: 'JOB_CONNECTORS',
      useFactory: (
        greenhouse: GreenhouseConnector,
        lever: LeverConnector,
        seed: SeedJobConnector,
      ): JobConnector[] => [greenhouse, lever, seed],
      inject: [GreenhouseConnector, LeverConnector, SeedJobConnector],
    },
  ],
  exports: [
    GreenhouseConnector,
    LeverConnector,
    SeedJobConnector,
    'JOB_CONNECTORS',
  ],
})
export class ConnectorsModule {}
