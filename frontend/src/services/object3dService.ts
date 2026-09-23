import { fetchApi } from './api';
import {
  Object3DItem,
  Generate3DParams,
  Regenerate3DParams,
  EngineStatus,
} from '../types/object3d';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const object3dService = {
  async generate3D(params: Generate3DParams): Promise<Object3DItem> {
    return fetchApi<Object3DItem>('/api/v1/3d-generator/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getHistory(limit = 50, offset = 0): Promise<{ items: Object3DItem[]; total: number }> {
    return fetchApi<{ items: Object3DItem[]; total: number }>(
      `/api/v1/3d-generator/history?limit=${limit}&offset=${offset}`
    );
  },

  async getGeneration(id: string): Promise<Object3DItem> {
    return fetchApi<Object3DItem>(`/api/v1/3d-generator/${id}`);
  },

  async regenerate3D(id: string, params: Regenerate3DParams): Promise<Object3DItem> {
    return fetchApi<Object3DItem>(`/api/v1/3d-generator/regenerate/${id}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async delete3D(id: string): Promise<void> {
    await fetchApi<{ status: string; id: string }>(`/api/v1/3d-generator/${id}`, {
      method: 'DELETE',
    });
  },

  async getEngineStatus(): Promise<EngineStatus> {
    return fetchApi<EngineStatus>('/api/v1/3d-generator/engines');
  },

  async getSpeciesLibrary(): Promise<{ total: number; categories: string[]; species: any[] }> {
    return fetchApi<{ total: number; categories: string[]; species: any[] }>('/api/v1/3d-generator/species');
  },

  getGlbUrl(id: string): string {
    return `${BASE_URL}/api/v1/3d-generator/assets/${id}.glb`;
  },

  getDownloadUrl(id: string): string {
    return `${BASE_URL}/api/v1/3d-generator/download/${id}`;
  },
};
