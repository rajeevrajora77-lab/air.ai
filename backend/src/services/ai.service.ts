import axios, { AxiosInstance } from 'axios';
import config from '../config';
import logger from '../utils/logger';
import { AIServiceError } from '../utils/errors';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  tokensUsed: number;
  model: string;
  provider: string;
  finishReason: string;
}

export type AIProvider = 
  | 'openrouter'    // Aggregator - access to 100+ models
  | 'openai'        // GPT-4, GPT-3.5-turbo
  | 'anthropic'     // Claude 3 Opus, Sonnet, Haiku
  | 'google'        // Gemini Pro, Gemini Ultra
  | 'cohere'        // Command, Command-Light
  | 'mistral'       // Mistral Large, Medium, Small
  | 'groq'          // Fast inference (Llama, Mixtral)
  | 'together'      // Open source models
  | 'replicate'     // Various open source models
  | 'huggingface';  // HuggingFace inference API

class AIService {
  private clients: Map<AIProvider, AxiosInstance> = new Map();
  private availableProviders: AIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // OpenRouter - Universal gateway to 100+ models
    if (config.OPENROUTER_API_KEY) {
      this.clients.set('openrouter', axios.create({
        baseURL: 'https://openrouter.ai/api/v1',
        headers: {
          'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://air.ai',
          'X-Title': 'air.ai Platform',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('openrouter');
      logger.info('✅ OpenRouter initialized');
    }

    // OpenAI - GPT models
    if (config.OPENAI_API_KEY) {
      this.clients.set('openai', axios.create({
        baseURL: 'https://api.openai.com/v1',
        headers: {
          'Authorization': `Bearer ${config.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('openai');
      logger.info('✅ OpenAI initialized');
    }

    // Anthropic - Claude models
    if (config.ANTHROPIC_API_KEY) {
      this.clients.set('anthropic', axios.create({
        baseURL: 'https://api.anthropic.com/v1',
        headers: {
          'x-api-key': config.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('anthropic');
      logger.info('✅ Anthropic initialized');
    }

    // Google AI - Gemini models
    if (config.GOOGLE_AI_API_KEY) {
      this.clients.set('google', axios.create({
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        params: { key: config.GOOGLE_AI_API_KEY },
        timeout: 60000,
      }));
      this.availableProviders.push('google');
      logger.info('✅ Google AI initialized');
    }

    // Cohere
    if (config.COHERE_API_KEY) {
      this.clients.set('cohere', axios.create({
        baseURL: 'https://api.cohere.ai/v1',
        headers: {
          'Authorization': `Bearer ${config.COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('cohere');
      logger.info('✅ Cohere initialized');
    }

    // Mistral AI
    if (config.MISTRAL_API_KEY) {
      this.clients.set('mistral', axios.create({
        baseURL: 'https://api.mistral.ai/v1',
        headers: {
          'Authorization': `Bearer ${config.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('mistral');
      logger.info('✅ Mistral AI initialized');
    }

    // Groq - Fast inference
    if (config.GROQ_API_KEY) {
      this.clients.set('groq', axios.create({
        baseURL: 'https://api.groq.com/openai/v1',
        headers: {
          'Authorization': `Bearer ${config.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('groq');
      logger.info('✅ Groq initialized');
    }

    // Together AI
    if (config.TOGETHER_API_KEY) {
      this.clients.set('together', axios.create({
        baseURL: 'https://api.together.xyz/v1',
        headers: {
          'Authorization': `Bearer ${config.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('together');
      logger.info('✅ Together AI initialized');
    }

    // Replicate
    if (config.REPLICATE_API_KEY) {
      this.clients.set('replicate', axios.create({
        baseURL: 'https://api.replicate.com/v1',
        headers: {
          'Authorization': `Token ${config.REPLICATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('replicate');
      logger.info('✅ Replicate initialized');
    }

    // HuggingFace
    if (config.HUGGINGFACE_API_KEY) {
      this.clients.set('huggingface', axios.create({
        baseURL: 'https://api-inference.huggingface.co/models',
        headers: {
          'Authorization': `Bearer ${config.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }));
      this.availableProviders.push('huggingface');
      logger.info('✅ HuggingFace initialized');
    }

    if (this.availableProviders.length === 0) {
      logger.error('❌ No AI providers configured!');
      throw new Error('At least one AI provider API key must be configured');
    }

    logger.info(`🤖 Initialized ${this.availableProviders.length} AI providers: ${this.availableProviders.join(', ')}`);
  }

  async chat(
    messages: AIMessage[],
    provider: AIProvider = this.availableProviders[0],
    model?: string
  ): Promise<AIResponse> {
    const client = this.clients.get(provider);
    if (!client) {
      throw new AIServiceError(`Provider ${provider} not configured`, provider);
    }

    try {
      switch (provider) {
        case 'openrouter':
          return await this.chatOpenRouter(client, messages, model);
        case 'openai':
          return await this.chatOpenAI(client, messages, model);
        case 'anthropic':
          return await this.chatAnthropic(client, messages, model);
        case 'google':
          return await this.chatGoogle(client, messages, model);
        case 'cohere':
          return await this.chatCohere(client, messages, model);
        case 'mistral':
          return await this.chatMistral(client, messages, model);
        case 'groq':
          return await this.chatGroq(client, messages, model);
        case 'together':
          return await this.chatTogether(client, messages, model);
        case 'replicate':
          return await this.chatReplicate(client, messages, model);
        case 'huggingface':
          return await this.chatHuggingFace(client, messages, model);
        default:
          throw new AIServiceError(`Unsupported provider: ${provider}`, provider);
      }
    } catch (error: any) {
      logger.error(`${provider} API error:`, error.response?.data || error.message);
      throw new AIServiceError(
        error.response?.data?.error?.message || error.message || 'AI service failed',
        provider
      );
    }
  }

  // OpenRouter - Universal gateway
  private async chatOpenRouter(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const response = await client.post('/chat/completions', {
      model: model || 'anthropic/claude-3.5-sonnet',
      messages,
    });

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage.total_tokens,
      model: response.data.model,
      provider: 'openrouter',
      finishReason: response.data.choices[0].finish_reason,
    };
  }

  // OpenAI
  private async chatOpenAI(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const response = await client.post('/chat/completions', {
      model: model || 'gpt-4-turbo-preview',
      messages,
    });

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage.total_tokens,
      model: response.data.model,
      provider: 'openai',
      finishReason: response.data.choices[0].finish_reason,
    };
  }

  // Anthropic Claude
  private async chatAnthropic(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await client.post('/messages', {
      model: model || 'claude-3-opus-20240229',
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: chatMessages,
    });

    return {
      content: response.data.content[0].text,
      tokensUsed: response.data.usage.input_tokens + response.data.usage.output_tokens,
      model: response.data.model,
      provider: 'anthropic',
      finishReason: response.data.stop_reason,
    };
  }

  // Google Gemini
  private async chatGoogle(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const modelName = model || 'gemini-pro';
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await client.post(`/models/${modelName}:generateContent`, {
      contents,
    });

    return {
      content: response.data.candidates[0].content.parts[0].text,
      tokensUsed: response.data.usageMetadata?.totalTokenCount || 0,
      model: modelName,
      provider: 'google',
      finishReason: response.data.candidates[0].finishReason,
    };
  }

  // Cohere
  private async chatCohere(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const response = await client.post('/chat', {
      model: model || 'command',
      message: messages[messages.length - 1].content,
      chat_history: messages.slice(0, -1).map(m => ({
        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: m.content,
      })),
    });

    return {
      content: response.data.text,
      tokensUsed: response.data.meta?.tokens?.input_tokens + response.data.meta?.tokens?.output_tokens || 0,
      model: model || 'command',
      provider: 'cohere',
      finishReason: 'complete',
    };
  }

  // Mistral
  private async chatMistral(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const response = await client.post('/chat/completions', {
      model: model || 'mistral-large-latest',
      messages,
    });

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage.total_tokens,
      model: response.data.model,
      provider: 'mistral',
      finishReason: response.data.choices[0].finish_reason,
    };
  }

  // Groq - Fast inference
  private async chatGroq(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const response = await client.post('/chat/completions', {
      model: model || 'mixtral-8x7b-32768',
      messages,
    });

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage.total_tokens,
      model: response.data.model,
      provider: 'groq',
      finishReason: response.data.choices[0].finish_reason,
    };
  }

  // Together AI
  private async chatTogether(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const response = await client.post('/chat/completions', {
      model: model || 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages,
    });

    return {
      content: response.data.choices[0].message.content,
      tokensUsed: response.data.usage.total_tokens,
      model: response.data.model,
      provider: 'together',
      finishReason: response.data.choices[0].finish_reason,
    };
  }

  // Replicate
  private async chatReplicate(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    // Replicate requires model version - simplified for this implementation
    throw new AIServiceError('Replicate provider requires specific model version configuration', 'replicate');
  }

  // HuggingFace
  private async chatHuggingFace(client: AxiosInstance, messages: AIMessage[], model?: string): Promise<AIResponse> {
    const modelPath = model || 'mistralai/Mistral-7B-Instruct-v0.2';
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const response = await client.post(`/${modelPath}`, {
      inputs: prompt,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
      },
    });

    return {
      content: response.data[0].generated_text,
      tokensUsed: 0, // HuggingFace doesn't return token count
      model: modelPath,
      provider: 'huggingface',
      finishReason: 'complete',
    };
  }

  getAvailableProviders(): AIProvider[] {
    return this.availableProviders;
  }

  getDefaultProvider(): AIProvider {
    return this.availableProviders[0];
  }
}

export const aiService = new AIService();
export default aiService;