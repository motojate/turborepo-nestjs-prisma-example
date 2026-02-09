export interface CollectorTarget {
  readonly id: string;
  readonly url: string;
  readonly enabled: boolean;
  readonly description?: string;
}
