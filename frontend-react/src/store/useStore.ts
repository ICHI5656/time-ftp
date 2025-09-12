import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// APIベースURL
const API_BASE = 'http://localhost:8091/api';

// プロファイル型定義
export interface Profile {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: 'ftp' | 'sftp';
  default_directory: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
}

// スケジュール型定義
export interface Schedule {
  id: string;
  name: string;
  profile_id: string;
  profile_name?: string;
  upload_directory: string;
  file_path?: string;
  schedule_time?: string;
  status: 'waiting' | 'executing' | 'completed' | 'failed';
  created_at?: string;
  executed_at?: string;
  error_message?: string;
}

// 履歴型定義
export interface History {
  id: string;
  profile_id: string;
  profile_name?: string;
  file_name: string;
  file_size: number;
  upload_directory: string;
  status: 'success' | 'failed';
  error_message?: string;
  uploaded_at: string;
  duration?: number;
}

// ストア型定義
interface StoreState {
  // プロファイル関連
  profiles: Profile[];
  currentProfile: Profile | null;
  
  // スケジュール関連
  schedules: Schedule[];
  
  // 履歴関連
  history: History[];
  
  // UI状態
  loading: boolean;
  error: string | null;
  
  // アクション
  fetchProfiles: () => Promise<void>;
  createProfile: (profile: Omit<Profile, 'id'>) => Promise<void>;
  updateProfile: (id: string, profile: Partial<Profile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  selectProfile: (profile: Profile) => void;
  testConnection: (profileId: string) => Promise<boolean>;
  
  fetchSchedules: () => Promise<void>;
  createSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>;
  executeSchedule: (id: string) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  
  fetchHistory: (limit?: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  
  uploadFile: (file: File, profileId: string, directory: string) => Promise<void>;
  browseDirectory: (profileId: string, path: string) => Promise<any>;
  
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Zustandストア
export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // 初期状態
      profiles: [],
      currentProfile: null,
      schedules: [],
      history: [],
      loading: false,
      error: null,
      
      // プロファイル管理
      fetchProfiles: async () => {
        set({ loading: true, error: null });
        try {
          const response = await axios.get(`${API_BASE}/profiles`);
          if (response.data.success) {
            set({ profiles: response.data.profiles });
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      createProfile: async (profile) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE}/profiles`, profile);
          if (response.data.success) {
            await get().fetchProfiles();
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      updateProfile: async (id, profile) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.put(`${API_BASE}/profiles/${id}`, profile);
          if (response.data.success) {
            await get().fetchProfiles();
            
            // 現在のプロファイルも更新
            const currentProfile = get().currentProfile;
            if (currentProfile && currentProfile.id === id) {
              set({ currentProfile: { ...currentProfile, ...profile } });
            }
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      deleteProfile: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.delete(`${API_BASE}/profiles/${id}`);
          if (response.data.success) {
            await get().fetchProfiles();
            
            // 削除されたプロファイルが選択中だった場合
            const currentProfile = get().currentProfile;
            if (currentProfile && currentProfile.id === id) {
              set({ currentProfile: null });
            }
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      selectProfile: (profile) => {
        set({ currentProfile: profile });
      },
      
      testConnection: async (profileId) => {
        try {
          const profile = get().profiles.find(p => p.id === profileId);
          if (!profile) {
            throw new Error('プロファイルが見つかりません');
          }
          
          const response = await axios.post(`${API_BASE}/test-connection`, {
            host: profile.host,
            port: profile.port,
            username: profile.username,
            password: profile.password,
            protocol: profile.protocol
          });
          
          return response.data.success;
        } catch (error) {
          return false;
        }
      },
      
      // スケジュール管理
      fetchSchedules: async () => {
        set({ loading: true, error: null });
        try {
          const response = await axios.get(`${API_BASE}/schedules`);
          if (response.data.success) {
            set({ schedules: response.data.schedules });
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      createSchedule: async (schedule) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE}/schedules`, schedule);
          if (response.data.success) {
            await get().fetchSchedules();
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      executeSchedule: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE}/schedules/${id}/execute`);
          if (response.data.success) {
            await get().fetchSchedules();
            await get().fetchHistory();
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      deleteSchedule: async (id) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.delete(`${API_BASE}/schedules/${id}`);
          if (response.data.success) {
            await get().fetchSchedules();
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      // 履歴管理
      fetchHistory: async (limit = 50) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.get(`${API_BASE}/history?limit=${limit}`);
          if (response.data.success) {
            set({ history: response.data.history });
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      clearHistory: async () => {
        set({ loading: true, error: null });
        try {
          const response = await axios.delete(`${API_BASE}/history`);
          if (response.data.success) {
            set({ history: [] });
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      // ファイルアップロード
      uploadFile: async (file, profileId, directory) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('profileId', profileId);
          formData.append('directory', directory);
          
          const response = await axios.post(`${API_BASE}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data.success) {
            await get().fetchHistory();
          } else {
            throw new Error(response.data.message);
          }
        } catch (error: any) {
          set({ error: error.message });
        } finally {
          set({ loading: false });
        }
      },
      
      // ディレクトリ参照
      browseDirectory: async (profileId, path) => {
        const profile = get().profiles.find(p => p.id === profileId);
        if (!profile) {
          throw new Error('プロファイルが見つかりません');
        }
        
        const response = await axios.post(`${API_BASE}/browse`, {
          host: profile.host,
          port: profile.port,
          username: profile.username,
          password: profile.password,
          protocol: profile.protocol,
          path: path
        });
        
        return response.data;
      },
      
      // エラー管理
      setError: (error) => set({ error }),
      clearError: () => set({ error: null })
    }),
    {
      name: 'ftp-manager-storage',
      partialize: (state) => ({
        currentProfile: state.currentProfile
      })
    }
  )
);