import { useHextimatorTheme } from 'hextimator/react';
import { CodeSnippet } from '../../code-snippet';
import { InteractiveCard } from '../interactive-card';

export function AIReady() {
  const { color } = useHextimatorTheme();

  return (
    <InteractiveCard className="p-3">
      <CodeSnippet
        tabs={[
          { label: 'npx', prefix: '❯', code: `npx hextimate "#${color}"` },
          { label: 'bunx', prefix: '❯', code: `bunx hextimate "#${color}"` },
          { label: 'pnpx', prefix: '❯', code: `pnpx hextimate "#${color}"` },
        ]}
      />
    </InteractiveCard>
  );
}
