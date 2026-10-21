import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '[http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)';

export const ingestRepository = async (owner: string, repo: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/ingest/?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`
  );
  return response.data;
};

export const askQuestion = async (question: string, keyword: string, repoUrl: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/ask/?question=${encodeURIComponent(question)}&keyword=${encodeURIComponent(keyword)}&repo_url=${encodeURIComponent(repoUrl)}`
  );
  return response.data;
};

export const fetchIngestedRepositories = async (): Promise<string[]> => {
  const response = await axios.get(`${API_BASE_URL}/ingest/repositories`);
  return response.data?.repositories || [];
};

export const clearDatabase = async () => {
  const response = await axios.delete(`${API_BASE_URL}/ingest/clear`);
  return response.data;
};