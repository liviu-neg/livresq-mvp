/**
 * Mock AI function for text editing
 * Later this will connect to a real API
 */
export async function generateTextEdit(
  selectedText: string,
  prompt: string
): Promise<string> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Mock response - in real implementation, this would call an API
  const mockResponses: Record<string, string> = {
    'make it shorter': `A concise version: ${selectedText.substring(0, Math.min(50, selectedText.length))}...`,
    'make it longer': `${selectedText} This expanded version provides more context and detail about the topic, offering readers a comprehensive understanding of the subject matter.`,
    'make it more formal': `The following text has been revised to adopt a more formal tone: ${selectedText}`,
    'make it casual': `Hey! So here's the deal: ${selectedText.toLowerCase()}`,
  };

  const lowerPrompt = prompt.toLowerCase();
  const matchedKey = Object.keys(mockResponses).find((key) =>
    lowerPrompt.includes(key)
  );

  if (matchedKey) {
    return mockResponses[matchedKey];
  }

  // Default: return an improved version
  return `[AI Generated] ${selectedText} - This text has been enhanced with AI assistance based on your request: "${prompt}".`;
}

