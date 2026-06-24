import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import axiosClient from "./axiosClient";

type CallApiWithRetriesParams = {
  url: string;
  config?: AxiosRequestConfig;
  delayMs?: number;
  retries?: number;
  retryCondition?: (error: AxiosError) => boolean;
};

const wait = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

const shouldRetryRequest = (error: AxiosError) => {
  const status = error.response?.status;

  return (
    !status ||
    status === 408 ||
    status === 429 ||
    (status >= 500 && status <= 599)
  );
};

const callApiWithRetries = async <T = AxiosResponse["data"],>({
  url,
  config,
  delayMs = 500,
  retries = 3,
  retryCondition = shouldRetryRequest,
}: CallApiWithRetriesParams): Promise<T> => {
  let lastError: unknown;
  const totalAttempts = Math.max(1, retries);

  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    try {
      const res = await axiosClient.request<T>({
        method: "GET",
        url,
        ...config,
      });
      return res.data;
    } catch (err) {
      lastError = err;

      const canRetry = axios.isAxiosError(err) && retryCondition(err);
      const isLastAttempt = attempt === totalAttempts - 1;

      if (isLastAttempt || !canRetry) {
        throw lastError;
      }

      await wait(delayMs * 2 ** attempt);
    }
  }

  throw lastError;
};

export default callApiWithRetries;
