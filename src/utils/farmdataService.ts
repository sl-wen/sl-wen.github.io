import { supabase } from './supabase-config';

export interface FarmDataCatStatus {
  position: { x: number; y: number };
  previousPosition: { x: number; y: number };
  frame: string;
  facingDirection: 'up' | 'down' | 'left' | 'right';
  health: number;
  maxHealth: number;
  coin: number;
  canPush: boolean;
  haveSword: boolean;
}

export interface FarmDataPayload {
  mapKey: string;
  catStatus: FarmDataCatStatus;
  savedAt: string; // ISO timestamp
  version?: string;
}

export const getFarmData = async (userId: string): Promise<FarmDataPayload | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('farmdata')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data?.farmdata as FarmDataPayload) || null;
  } catch (error) {
    console.error('获取农场数据失败:', error);
    return null;
  }
};

export const saveFarmData = async (userId: string, payload: FarmDataPayload): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ farmdata: payload })
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('保存农场数据失败:', error);
    return false;
  }
};

