const axios = require('axios');

class OllamaClient {
  constructor() {
    if (OllamaClient.instance) return OllamaClient.instance;

    this.model = 'llama3.2:3b';
    this.apiUrl = 'http://localhost:11434/api/generate';

    OllamaClient.instance = this;
  }

  async generate(prompt) {
      const res = await axios.post(this.apiUrl, {
        model: this.model,
        prompt,
        stream: false
      });
      
      const raw = res.data?.response?.trim();
      return raw.replace(/[^\w\s-]/g, "");
  }
}

module.exports = new OllamaClient();
