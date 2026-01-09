import axios from 'axios';

const API_URL = 'http://localhost:8080/api/waitlist';

export interface WaitlistResponse {
  success: boolean;
  message?: string;
  position?: number;
  registeredAt?: string;
  totalRegistrations?: number;
}

// 1. Join Waitlist
export const joinWaitlist = async (email: string): Promise<WaitlistResponse> => {
  try {
    const response = await axios.post(`${API_URL}/register`, { email });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to join waitlist');
  }
};

// 2. Get Status / Position
export const getWaitlistStatus = async (email: string): Promise<WaitlistResponse> => {
  try {
    const response = await axios.get(`${API_URL}/position/${email}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch status');
  }
};

// 3. Get Global Stats
export const getWaitlistStats = async (): Promise<number> => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data.totalRegistrations || 0;
  } catch (error) {
    console.error('Error fetching stats', error);
    return 0;
  }
};

// 4. Admin Reset (Requires Secret Key)
export const resetWaitlist = async (adminKey: string): Promise<WaitlistResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/reset`, {
      headers: {
        'x-admin-key': adminKey
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Reset failed');
  }
};