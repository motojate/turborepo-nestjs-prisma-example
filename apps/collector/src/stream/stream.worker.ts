import { Logger } from '@nestjs/common';
import { WebSocket as UndiciWS } from 'undici';
import type {
  MessageEvent as WsMessageEvent,
  CloseEvent as WsCloseEvent,
} from 'undici';
import { WebSocketFactory } from 'src/network/network.module';
import {
  CollectorTarget,
  MessageContext,
  RawMessage,
} from '@renderer-orchestrator/common';
import { randomUUID } from 'crypto';

type StopReason = 'manual' | 'error' | 'close';

export class StreamWorker {
  private readonly logger: Logger;

  private ws: UndiciWS | null = null;

  private pollTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;

  private seq = 0;
  private reconnectAttempts = 0;
  private isRunning = false;

  constructor(
    private readonly target: CollectorTarget,
    private readonly createSocket: WebSocketFactory,
    private readonly queue: any[],
  ) {
    this.logger = new Logger(
      `StreamWorker:${target.id} / ${target.description}`,
    );
  }

  /**
   * [Public API] 워커 시작
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * [Public API] 워커 중지 (자원 정리)
   */
  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.teardown('manual');
    this.logger.log('수집 종료');
  }

  private connect() {
    if (!this.isRunning) return;

    this.teardownSocketOnly();

    this.logger.debug(`연결 시도... (${this.target.url})`);
    let ws: UndiciWS;

    try {
      ws = this.createSocket(this.target.url);
    } catch (e) {
      this.logger.error(`초기화 에러: ${String(e)}`);
      return this.scheduleReconnect();
    }

    this.ws = ws;

    ws.onopen = () => this.onOpen();
    ws.onmessage = (e) => this.onMessage(e);
    ws.onerror = (e) => this.onError(e);
    ws.onclose = (e) => this.onClose(e);
  }

  private onOpen() {
    if (!this.isRunning) return;

    this.logger.log('✅ 연결 성공');
    this.reconnectAttempts = 0;

    this.startPolling();
  }

  private onError(event: Event) {
    const msg = (event as any)?.message ?? 'Unknown';
    this.logger.error(`소켓 에러: ${msg}`);

    this.handleDisconnect('error');
  }

  private onClose(event: WsCloseEvent) {
    this.logger.warn(`연결 끊김 (Code: ${event.code})`);
    this.handleDisconnect('close');
  }

  private handleDisconnect(_reason: StopReason) {
    if (!this.isRunning) return;

    this.stopPolling();
    this.teardownSocketOnly();

    this.scheduleReconnect();
  }

  private startPolling() {
    this.stopPolling();

    const tick = () => {
      if (!this.isRunning) return;
      if (!this.canSend()) {
        // 연결 준비가 아니면 잠깐 후 재시도 (재연결은 close/error에서 처리)
        this.pollTimer = setTimeout(tick, 300);
        return;
      }

      const payload = JSON.stringify({
        ts: Date.now(),
        seq: this.seq++,
        event: 'metrics',
        sender: 'collector',
      });

      try {
        this.ws!.send(payload);
      } catch (e) {
        this.logger.warn(`전송 실패: ${String(e)}`);
        // send 실패도 연결 이상일 가능성이 커서 끊김 처리
        this.handleDisconnect('error');
        return;
      }

      this.pollTimer = setTimeout(tick, 1000);
    };

    tick();
  }

  private stopPolling() {
    if (this.pollTimer) clearTimeout(this.pollTimer);
    this.pollTimer = undefined;
  }

  private canSend(): boolean {
    if (!this.ws) return false;

    // undici WebSocket readyState: 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED
    return this.ws.readyState === 1;
  }

  private onMessage(event: WsMessageEvent) {
    const correlationId = randomUUID();
    const now = Date.now();

    try {
      const payloadStr = this.decodeMessageData(event.data);

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
      };

      // 여기서 queue가 BullMQ면 add로 적재
      // fire-and-forget 유지하되, backpressure 고려하면 await/limiter도 고민 가능
      // this.queue.add('ingest', { data: raw, ctx }, { jobId: correlationId, attempts: 3, removeOnComplete: true, removeOnFail: 1000 })
      //   .catch(err => this.logger.error(`Queue Error: ${err?.message ?? err}`));
      void raw;
      void ctx;
    } catch (e) {
      this.logger.error(`Parse Error: ${String(e)}`);
    }
  }

  private decodeMessageData(data: unknown): string {
    if (typeof data === 'string') return data;

    // undici ws data는 ArrayBuffer / Uint8Array 등이 올 수 있음
    if (data instanceof ArrayBuffer) {
      return Buffer.from(data).toString('utf-8');
    }

    // @ts-ignore: 런타임 방어
    if (data?.buffer instanceof ArrayBuffer) {
      // Uint8Array 같은 경우
      // @ts-ignore
      return Buffer.from(data).toString('utf-8');
    }

    // 마지막 fallback
    return String(data);
  }

  // ---------------------------
  // Reconnect
  // ---------------------------

  private scheduleReconnect() {
    if (!this.isRunning) return;
    if (this.reconnectTimer) return;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);
    this.reconnectAttempts++;

    this.logger.log(`🔄 ${delay}ms 후 재연결 시도...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  // ---------------------------
  // Teardown
  // ---------------------------

  private teardown(reason: StopReason) {
    this.stopPolling();

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;

    this.teardownSocketOnly();

    if (reason === 'manual') {
      // manual stop이면 재연결 카운터도 리셋해도 됨(선택)
      this.reconnectAttempts = 0;
    }
  }

  private teardownSocketOnly() {
    if (!this.ws) return;

    try {
      // 이미 닫힌 상태여도 close 호출은 안전한 편
      this.ws.close();
    } catch {
      // ignore
    } finally {
      this.ws = null;
    }
  }
}
