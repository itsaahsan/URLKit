import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export interface URLItem {
  short_code: string;
  short_url: string;
  original_url: string;
  clicks: number;
  created_at: string;
  expires_at?: string;
}

export interface AnalyticsData {
  short_code: string;
  short_url: string;
  original_url: string;
  clicks: number;
  created_at: string;
  clicks_per_day: { date: string; count: number }[];
  browsers: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  operating_systems: { name: string; count: number }[];
  referrers: { name: string; count: number }[];
}

export interface QRData {
  qr_code: string;
  short_url: string;
}

export const shortenUrl = (url: string, custom_alias?: string, expires_at?: string) =>
  api.post<URLItem>("/shorten/", { url, custom_alias, expires_at });

export const listUrls = () => api.get<URLItem[]>("/urls/");

export const getAnalytics = (code: string) =>
  api.get<AnalyticsData>(`/urls/${code}/analytics/`);

export const getQRCode = (code: string, fill?: string, bg?: string, style?: string) => {
  const params = new URLSearchParams();
  if (fill) params.set("fill", fill);
  if (bg) params.set("bg", bg);
  if (style) params.set("style", style);
  return api.get<QRData>(`/urls/${code}/qr/?${params}`);
};

export const deleteUrl = (code: string) => api.delete(`/urls/${code}/`);
