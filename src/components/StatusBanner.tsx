interface StatusBannerProps {
  messages: string[];
  tone: 'warning' | 'error';
}

export function StatusBanner({ messages, tone }: StatusBannerProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={`status-banner status-banner-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {messages.map((message) => (
        <p key={message}>{message}</p>
      ))}
    </div>
  );
}
