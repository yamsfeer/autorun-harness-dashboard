import { useState } from 'react';
import { api } from '../api/client';

interface ScreenshotViewerProps {
  projectId: string;
  screenshots: string[];
}

export default function ScreenshotViewer({ projectId, screenshots }: ScreenshotViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getFilename = (path: string): string => {
    return path.split('/').pop() || path;
  };

  const getUrl = (path: string): string => {
    const filename = getFilename(path);
    return api.getScreenshotUrl(projectId, filename);
  };

  if (screenshots.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Thumbnails */}
      <div className="flex gap-2 flex-wrap">
        {screenshots.map((screenshot, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className="w-20 h-20 border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-primary-500 transition-colors"
          >
            <img
              src={getUrl(screenshot)}
              alt={`Screenshot ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23f3f4f6" width="80" height="80"/><text x="40" y="45" text-anchor="middle" fill="%239ca3af" font-size="12">无图片</text></svg>';
              }}
            />
          </div>
        ))}
      </div>

      {/* Full size modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <img
              src={getUrl(screenshots[selectedIndex])}
              alt={`Screenshot ${selectedIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Navigation */}
            {screenshots.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((selectedIndex - 1 + screenshots.length) % screenshots.length);
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-r text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex((selectedIndex + 1) % screenshots.length);
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 rounded-l text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {selectedIndex + 1} / {screenshots.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
