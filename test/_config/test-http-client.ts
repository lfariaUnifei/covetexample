import request from 'supertest';

export type HttpResponse<T> = {
  status: number;
  body: T;
};

export class TestHttpClient {
  constructor(private readonly application: unknown) {}

  async post<T>(url: string, body: any): Promise<HttpResponse<T>> {
    const result = await request(this.application).post(url).send(body);
    return {
      body: result.body,
      status: result.status,
    };
  }

  async get<T>(url: string, query?: any): Promise<HttpResponse<T>> {
    return request(this.application).get(url).query(query);
  }

  async delete(url: string): Promise<void> {
    await request(this.application).delete(url);
  }
}
