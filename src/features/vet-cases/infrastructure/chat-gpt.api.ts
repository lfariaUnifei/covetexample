import { OpenAI } from 'openai';

type ChatGPTApiParams = {
  apiKey: string;
  model: 'gpt-4o' | 'gpt-3.5-turbo' | 'gpt-4o-mini';
};

export class ChatGptApi {
  private readonly client: OpenAI;
  constructor(private readonly params: ChatGPTApiParams) {
    this.client = new OpenAI({
      apiKey: params.apiKey,
    });
  }

  public async executePrompt(prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.params.model,
      });
      return completion.choices[0].message.content ?? '{}';
    } catch (error) {
      console.error('Error fetching response from ChatGPT:', error);
      throw error;
    }
  }
}
