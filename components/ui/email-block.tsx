import { ReactNode } from 'react';

export const Block = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      borderRadius: '10px',
      background: 'rgba(2, 48, 71, 0.03)',
      border: '1px solid rgba(2, 48, 71, 0.08)',
      padding: '14px',
      marginTop: '12px',
    }}
  >
    {children}
  </div>
);
