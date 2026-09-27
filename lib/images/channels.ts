// Shared (client-safe): which pieces get an image, and the shape that suits each.
export type ImageSize = "1024x1024" | "1536x1024" | "1024x1536";

export const IMAGE_CHANNELS: Record<string, ImageSize> = {
  instagram: "1024x1024",
  facebook: "1536x1024",
  linkedin: "1536x1024",
  newsletter: "1536x1024",
  blog: "1536x1024",
};

const ASPECT: Record<ImageSize, string> = {
  "1024x1024": "square (1:1)",
  "1536x1024": "landscape (3:2)",
  "1024x1536": "portrait (2:3)",
};

const CHANNEL_NAMES: Record<string, string> = {
  instagram: "an Instagram post",
  facebook: "a Facebook post",
  linkedin: "a LinkedIn post",
  newsletter: "an email newsletter header",
  blog: "a blog post header",
};

// Ready-to-paste instructions for ChatGPT's image generator.
export function chatGptImagePrompt(channel: string, prompt: string): string {
  const size = IMAGE_CHANNELS[channel] ?? "1024x1024";
  return `Create an image for ${CHANNEL_NAMES[channel] ?? "a social media post"}. Make it ${ASPECT[size]}. Don't include any text or logos in the image.\n\n${prompt}`;
}
