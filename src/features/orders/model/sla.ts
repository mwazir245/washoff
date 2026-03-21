import type { ISODateString } from "@/features/orders/model/common";

export enum SLACheckpoint {
  MatchingResponse = "matching_response",
  Acceptance = "acceptance",
  Pickup = "pickup",
  Processing = "processing",
  Delivery = "delivery",
  Completion = "completion",
}

export enum SLAStatus {
  OnTrack = "on_track",
  AtRisk = "at_risk",
  Breached = "breached",
  Met = "met",
}

export interface SLAHistory {
  id: string;
  orderId: string;
  checkpoint: SLACheckpoint;
  targetAt: ISODateString;
  actualAt?: ISODateString;
  status: SLAStatus;
  recordedAt: ISODateString;
  notesAr?: string;
}
