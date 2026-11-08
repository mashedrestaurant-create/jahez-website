declare module "web-push" {
  type PushSubscription = {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(
      subscription: PushSubscription,
      payload?: string | Buffer | null,
      options?: { TTL?: number; timeout?: number; urgency?: "very-low" | "low" | "normal" | "high"; topic?: string },
    ): Promise<{ statusCode: number; body: string; headers: Record<string, string> }>;
  };

  export default webpush;
}
