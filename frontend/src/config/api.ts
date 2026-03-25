// Em desenvolvimento, usa '/api' (proxy do Vite → localhost:3001)
// Em produção, VITE_API_URL deve ser definida no deployment Vercel de cada empresa
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Removido log de debug com informações sensíveis

export const api = {
  baseURL: API_BASE_URL,

  async request(endpoint: string, options: RequestInit = {}, isRetry: boolean = false): Promise<any> {
    const token = localStorage.getItem('access_token');

    // Headers padrão limpos
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Adiciona token se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Criar AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error('⏱️ Request timeout após 60 segundos');
    }, 60000); // 60 segundos de timeout

    // Não adiciona headers customizados que possam causar problemas
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Importante para CORS
      mode: 'cors', // Explicitamente define modo CORS
      signal: controller.signal, // Adiciona signal para timeout
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      clearTimeout(timeoutId); // Limpa timeout se resposta chegou

      if (!response.ok) {
        // Se for erro 401 (não autorizado) e não for uma retry, tentar refresh do token
        if (response.status === 401 && !isRetry) {
          console.log('🔄 Token expirado, tentando renovar...');

          // Importar supabase dinamicamente para evitar circular dependency
          const { supabase } = await import('../lib/supabase');

          // Tentar renovar o token
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

          if (!refreshError && session?.access_token) {
            console.log('✅ Token renovado com sucesso, tentando novamente...');
            localStorage.setItem('access_token', session.access_token);

            // Tentar novamente com o novo token
            return this.request(endpoint, options, true);
          } else {
            console.error('❌ Falha ao renovar token:', refreshError);
            // Se falhar, fazer logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/login';
            throw new Error('Sessão expirada. Por favor, faça login novamente.');
          }
        }

        let errorData: any = { message: `HTTP error! status: ${response.status}` };

        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const text = await response.text();
            if (text && text.trim() !== '') {
              errorData = JSON.parse(text);
            }
          } else {
            const text = await response.text();
            if (text) {
              errorData = { message: text };
            }
          }
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta de erro:', parseError);
        }

        const error: any = new Error(errorData.message || errorData.error || 'API request failed');
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }

      // Verifica se a resposta é JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        // Ler o texto primeiro para verificar se está vazio
        const text = await response.text();

        // Se a resposta estiver vazia, retornar objeto de sucesso padrão
        if (!text || text.trim() === '') {
          console.warn('⚠️ API retornou resposta JSON vazia');
          return { success: true };
        }

        // Tentar fazer parse do JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse de JSON:', text);
          const error: any = new Error('Resposta inválida do servidor');
          error.response = {
            status: response.status,
            data: { error: 'Invalid JSON response' }
          };
          throw error;
        }

        // Se a resposta tem sucesso mas está estruturada diferente
        if (data.success === false) {
          const error: any = new Error(data.error || data.message || 'Request failed');
          error.response = {
            status: response.status,
            data: data
          };
          throw error;
        }

        return data;
      } else {
        // Se não for JSON, retorna como texto
        return await response.text();
      }
    } catch (error: any) {
      clearTimeout(timeoutId); // Limpa timeout em caso de erro

      // Detectar se foi timeout (AbortError)
      if (error.name === 'AbortError') {
        console.error('❌ Timeout: Servidor não respondeu em 60 segundos');
        const timeoutError: any = new Error('Tempo limite excedido. O servidor está demorando muito para responder. Tente novamente.');
        timeoutError.isTimeout = true;
        throw timeoutError;
      }

      // Se for erro de rede/conexão
      if (!error.response) {
        error.request = true;
      }

      // Log de debug em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('API Request Error:', {
          endpoint,
          method: options.method || 'GET',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }

      throw error;
    }
  },

  get(endpoint: string, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'GET',
      headers: customHeaders
    });
  },

  post(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  put(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  patch(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  delete(endpoint: string, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: customHeaders
    });
  },

  // Método específico para download de arquivos (blob)
  async downloadFile(endpoint: string): Promise<Blob> {
    const token = localStorage.getItem('access_token');

    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      headers: headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        const errorText = await response.text();
        const error: any = new Error(`HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          data: { error: errorText }
        };
        throw error;
      }

      // Retorna o blob diretamente
      return await response.blob();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('File Download Error:', {
          endpoint,
          error: error.message,
          status: error.response?.status
        });
      }
      throw error;
    }
  },
};
