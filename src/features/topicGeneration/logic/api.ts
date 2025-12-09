import { TopicResponse } from '../types';
import { SettingsManager } from '../../settings/logic/settingsManager';

const getApiConfig = async () => {
  const settings = await SettingsManager.getSettings();
  if (!settings) {
    throw new Error('Please configure API settings first.');
  }
  return settings;
};

export const generateTopicContent = async (topic: string): Promise<TopicResponse> => {
  const { apiBaseUrl, authHeader } = await getApiConfig();
  
  try {
    const response = await fetch(`${apiBaseUrl}/78871f55-928a-42e5-bac4-0e58470443ce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data as TopicResponse;
  } catch (error) {
    console.error('Error generating topic content:', error);
    throw error;
  }
};

export const regenerateImage = async (prompt: string): Promise<string> => {
  const { apiBaseUrl, authHeader } = await getApiConfig();
  
  try {
    const response = await fetch(`${apiBaseUrl}/7858b101-49be-45ef-ab59-d4b35c594b2a`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        copywriting: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Regeneration API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Regenerate API Response:', data);

    // Expecting array response: [{ content: "...", uploadPath: "..." }]
    if (Array.isArray(data) && data.length > 0 && data[0].uploadPath) {
      return data[0].uploadPath;
    }
    
    throw new Error(`Invalid response format. Data: ${JSON.stringify(data)}`);

  } catch (error) {
    console.error('Error regenerating image:', error);
    throw error;
  }
};
