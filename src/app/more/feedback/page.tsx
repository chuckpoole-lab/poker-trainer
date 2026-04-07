'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/services/auth-context';
import { FeedbackSurvey } from '@/components/play/FeedbackSurvey';
import { submitFeedback } from '@/lib/services/play-storage';
import type { FeedbackData } from '@/components/play/FeedbackSurvey';

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (data: FeedbackData) => {
    await submitFeedback(user?.id || null, data);
  };

  return (
    <div style={{
      padding: '24px 20px 16px',
      maxWidth: 480,
      margin: '0 auto',
    }}>
      <FeedbackSurvey
        onClose={() => router.push('/more')}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
