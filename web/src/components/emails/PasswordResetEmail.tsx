import * as React from 'react';

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  expiresAt: Date;
}

export default function PasswordResetEmail({
  userName,
  resetUrl,
  expiresAt,
}: PasswordResetEmailProps) {
  const expirationText = expiresAt.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  });

  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: '#1f2937', margin: '0 0 20px 0' }}>
          パスワードリセットのご案内
        </h1>
        <div
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <p
            style={{
              color: '#374151',
              lineHeight: '1.6',
              margin: '0 0 20px 0',
            }}
          >
            こんにちは、{userName}さん
          </p>
          <p
            style={{
              color: '#374151',
              lineHeight: '1.6',
              margin: '0 0 20px 0',
            }}
          >
            ExamForgeアカウントのパスワードリセットがリクエストされました。
          </p>
          <p
            style={{
              color: '#374151',
              lineHeight: '1.6',
              margin: '0 0 30px 0',
            }}
          >
            以下のボタンをクリックして、新しいパスワードを設定してください：
          </p>

          <a
            href={resetUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '14px 28px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              margin: '0 0 30px 0',
            }}
          >
            パスワードをリセット
          </a>

          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '16px',
              margin: '20px 0',
            }}
          >
            <p
              style={{
                color: '#dc2626',
                margin: '0',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              ⚠️ セキュリティに関する重要な情報
            </p>
            <ul
              style={{
                color: '#dc2626',
                fontSize: '14px',
                margin: '10px 0 0 0',
                paddingLeft: '20px',
              }}
            >
              <li>このリンクは {expirationText} まで有効です</li>
              <li>リンクは1回のみ使用可能です</li>
              <li>心当たりがない場合は、このメールを無視してください</li>
            </ul>
          </div>

          <p
            style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: '20px 0 0 0',
            }}
          >
            上記のボタンが機能しない場合は、以下のURLをブラウザにコピー＆ペーストしてください：
            <br />
            <span style={{ wordBreak: 'break-all', color: '#3b82f6' }}>
              {resetUrl}
            </span>
          </p>
        </div>

        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: '#f3f4f6',
            borderRadius: '6px',
          }}
        >
          <p style={{ color: '#6b7280', fontSize: '12px', margin: '0' }}>
            このメールはExamForgeから自動送信されています。
            <br />
            ご質問がございましたら、サポートまでお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
