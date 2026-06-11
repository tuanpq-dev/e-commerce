import axiosClient from "./axiosClient";

type CallApiWithRetriesParams = {
  url: string;
  retries?: number;
};

const callApiWithRetries = async ({
  url,
  retries = 3,
}: CallApiWithRetriesParams) => {
  let lastError: unknown;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await axiosClient.get(url);
      return res.data;
    } catch (err) {
      lastError = err;

      if (i === retries - 1) {
        throw lastError;
      }
    }
  }

  throw lastError;
};

export default callApiWithRetries;
