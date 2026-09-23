const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { error: { message: response.statusText || 'Request failed' } };
    }
    const message = errorData.error?.message || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
