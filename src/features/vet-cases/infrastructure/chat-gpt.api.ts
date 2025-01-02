import axios, { AxiosInstance } from 'axios';

type ChatGPTApiParams = {
  apiUrl: string;
  apiKey: string;
  model: 'chatgpt-4o-latest' | 'o1-2024-12-17';
};

export class ChatGptApi {
  private readonly client: AxiosInstance;
  constructor(params: ChatGPTApiParams) {
    this.client = axios.create({
      baseURL: params.apiUrl,
      data: {
        model: params.model,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.apiKey}`,
      },
    });
  }

  public async getResponse(prompt: string): Promise<string> {
    try {
      const response = await this.client.post('completions', {
        prompt,
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.7,
      });
      return response.data.choices[0].text;
    } catch (error) {
      console.error('Error fetching response from ChatGPT:', error);
      throw error;
    }
  }
}
