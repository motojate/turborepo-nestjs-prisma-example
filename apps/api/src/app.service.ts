import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(test: number): string {
    return 'Hello World!';
  }
}
