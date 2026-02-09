type Transport = "udp" | "ws" | "tcp" | "http";
type RawPayload = Buffer | string | Uint8Array | ArrayBuffer;

type RemoteInfo = {
  address: string;
  addressKey: string;
  port?: number;
  connId?: string;
};

export type RawMessage = {
  payload: RawPayload;
  transport: Transport;
  receivedAt: number;
  remote?: RemoteInfo;
  topic?: string;
  headers?: Record<string, string | string[]>;
  contentType?: string;
};

export type MessageContext = {
  correlationId: string;
  traceId?: string;
  spanId?: string;

  receivedAt: number;
  transport: Transport;
  remote: RemoteInfo;

  source?: string;
  attempt?: number;
  tags?: Record<string, string>;
};

export type Envelope<T> = {
  data: T;
  ctx: MessageContext;
};
