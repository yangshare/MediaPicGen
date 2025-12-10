import React, { useEffect } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import { EditorLayout } from './EditorLayout';

interface AIEditorProps {
  initialImageUrl?: string | null;
  onBack: () => void;
  onConsumedInitialImage?: () => void;
}

const AIEditorContent: React.FC<AIEditorProps> = ({ initialImageUrl, onBack, onConsumedInitialImage }) => {
  const { addSession, sessions } = useEditorStore();
  const processedRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (initialImageUrl && processedRef.current !== initialImageUrl) {
      // Check if this URL is already added to avoid duplicates on re-render
      const exists = sessions.some(s => s.originalUrl === initialImageUrl);
      if (!exists) {
        addSession(initialImageUrl);
        processedRef.current = initialImageUrl;
        onConsumedInitialImage?.();
      }
    }
  }, [initialImageUrl, sessions]); // Keep sessions in dependency to ensure fresh state check, but processedRef prevents loop

  return <EditorLayout onBack={onBack} />;
};

export const AIEditor: React.FC<AIEditorProps> = (props) => {
  return <AIEditorContent {...props} />;
};
