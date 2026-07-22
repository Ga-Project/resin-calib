// resin-calib — UI 層で共有する型。純粋ロジック（lib/*.mjs）の JSDoc 形状と一致させる。

export type CureState = "under" | "good" | "over";

export interface RerfStep {
  exposureS: number;
  state: CureState;
}

export interface GoodBand {
  loS: number;
  hiS: number;
}

export interface EstimateResult {
  status: "ok" | "no-good" | "all-under" | "all-over" | "empty";
  recommendedS: number | null;
  goodBand: GoodBand | null;
  contiguous: boolean;
  message: string;
}

export interface Profile {
  id: string;
  createdAt: number;
  printer: string;
  resin: string;
  resinType: string;
  tempC: number | null;
  fep: string;
  layerHeightMm: number | null;
  normalExposureS: number;
  bottomExposureS: number | null;
  bottomLayers: number | null;
  lightOffDelayS: number | null;
  note: string;
}

/** 新規記録フォームの初期値生成に使う、未保存の素案（id/createdAt はまだ無い）。 */
export type ProfileDraft = Omit<Profile, "id" | "createdAt">;
