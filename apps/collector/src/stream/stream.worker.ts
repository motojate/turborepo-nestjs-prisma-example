import { Logger } from '@nestjs/common';
import { CloseEvent, WebSocket } from 'undici';
import { WebSocketFactory } from 'src/network/network.module';
import {
  CollectorTarget,
  MessageContext,
  RawMessage,
} from '@renderer-orchestrator/common';
import { randomUUID } from 'crypto';

export class StreamWoker {
  private ws: WebSocket | null = null;
  private sendTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;

  private seq = 0;
  private reconnectAttempts = 0;
  private isRunning = false;

  private readonly logger: Logger;

  constructor(
    private readonly target: CollectorTarget,
    private readonly createSocket: WebSocketFactory,
    private readonly queue: any[],
  ) {
    this.logger = new Logger(
      `StreamWorker:${target.url} / ${target.description}`,
    );
  }

  /**
   * [Public API] 워커 시작
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.connect();
  }

  /**
   * [Public API] 워커 중지 (자원 정리)
   */
  stop() {
    this.isRunning = false;
    this.cleanup();
    this.logger.log('수집 종료');
  }

  private connect() {
    if (!this.isRunning) return;

    // 기존 소켓 정리
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      this.logger.debug(`연결 시도... (${this.target.url})`);

      const ws = this.createSocket(this.target.url);
      this.ws = ws;

      // this 바인딩을 위해 화살표 함수나 bind 사용
      ws.onopen = () => this.handleOpen();
      //   ws.onmessage = (e) => this.handleMessage(e);
      ws.onerror = (e) => this.handleError(e);
      ws.onclose = (e) => this.handleClose(e);
    } catch (error) {
      this.logger.error(`초기화 에러: ${error}`);
      this.scheduleReconnect();
    }
  }

  private handleOpen() {
    this.logger.log('✅ 연결 성공');
    this.reconnectAttempts = 0;
    this.startRequestLoop();
  }

  private startRequestLoop() {
    if (this.sendTimer) clearInterval(this.sendTimer);

    const loop = () => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const payload = JSON.stringify({
        ts: Date.now(),
        seq: this.seq++,
        event: 'metrics',
        sender: 'collector',
      });

      try {
        this.ws.send(payload);
      } catch (e) {
        this.logger.warn(`전송 실패: ${e}`);
      }
    };

    // 즉시 실행 후 1초 간격 반복
    loop();
    this.sendTimer = setInterval(loop, 1000);
  }

  private handleMessage(event: MessageEvent) {
    // 큐 적재 로직 (Fire-and-Forget)
    const correlationId = randomUUID();
    const now = Date.now();

    try {
      const payloadStr =
        typeof event.data === 'string'
          ? event.data
          : Buffer.from(event.data as ArrayBuffer).toString('utf-8');

      const raw: RawMessage = {
        payload: payloadStr,
        transport: 'ws',
        receivedAt: now,
        remote: { address: this.target.url, addressKey: this.target.id },
        topic: 'metrics',
        contentType: 'application/json',
      };

      const ctx: MessageContext = {
        correlationId,
        receivedAt: now,
        transport: 'ws',
        remote: raw.remote,
        // source: this.target.name,
      };

      //   this.queue
      //     .add(
      //       'ingest',
      //       { data: raw, ctx },
      //       {
      //         jobId: correlationId,
      //         attempts: 3,
      //         removeOnComplete: true, // 운영 환경: true
      //         removeOnFail: 1000,
      //       },
      //     )
      //     .catch((err) => {
      //       this.logger.error(`Queue Error: ${err.message}`);
      //     });
    } catch (e) {
      this.logger.error(`Parse Error: ${e}`);
    }
  }

  private handleError(event: Event) {
    const msg = (event as any).message || 'Unknown';
    this.logger.error(`🔥 소켓 에러: ${msg}`);
  }

  private handleClose(event: CloseEvent) {
    this.logger.warn(`⚠️ 연결 끊김 (Code: ${event.code})`);
    if (this.sendTimer) clearInterval(this.sendTimer);
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (!this.isRunning || this.reconnectTimer) return;

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30_000);

    this.logger.log(`🔄 ${delay}ms 후 재연결 시도...`);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  private cleanup() {
    if (this.sendTimer) clearInterval(this.sendTimer);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
