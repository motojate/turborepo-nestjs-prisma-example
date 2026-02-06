import {
  BeforeApplicationShutdown,
  Module,
  OnApplicationShutdown,
  OnModuleDestroy,
} from '@nestjs/common';

@Module({
  imports: [],
})
export class AppModule
  implements OnModuleDestroy, BeforeApplicationShutdown, OnApplicationShutdown
{
  onModuleDestroy() {
    console.error('onModuleDestroy', 1);
  }

  beforeApplicationShutdown(signal?: string) {
    console.log('beforeApplicationShutdown signal:', signal);
  }

  onApplicationShutdown(signal?: string) {
    console.log('onApplicationShutdown signal:', signal);
  }
}
