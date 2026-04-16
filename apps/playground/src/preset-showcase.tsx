import type { HextimatePreset } from 'hextimator';
import { presets } from 'hextimator';
import {
  HextimatorScope,
  HextimatorStyle,
  useHextimatorTheme,
} from 'hextimator/react';
import { useId, useMemo } from 'react';

function styleSelectorFromReactId(reactId: string) {
  return `preset-showcase-hx-${reactId.replace(/[^a-zA-Z0-9_-]+/g, '')}`;
}

const GENERATION_PRESETS = [
  { id: 'tinted', label: 'Tinted', preset: presets.tinted },
  { id: 'muted', label: 'Muted', preset: presets.muted },
  { id: 'bold', label: 'Bold', preset: presets.bold },
  { id: 'vibrant', label: 'Vibrant', preset: presets.vibrant },
] as const;

export type GenerationPresetId = (typeof GENERATION_PRESETS)[number]['id'];

export function activeGenerationPresetId(
  activePresets: HextimatePreset[] | undefined,
): GenerationPresetId | null {
  const p = activePresets?.[0];
  if (!p) return null;
  const match = GENERATION_PRESETS.find((entry) => entry.preset === p);
  return match?.id ?? null;
}

export function buildPlaygroundCode(
  color: string,
  presetId: GenerationPresetId | null,
): string {
  const literal =
    color.includes("'") || color.includes('"') || color.includes('\n')
      ? JSON.stringify(color)
      : `'${color}'`;
  const head =
    presetId === null
      ? `hextimate(${literal})`
      : `hextimate(${literal})\n  .preset(presets.${presetId})`;
  return `${head}
  // .style({ minContrastRatio: 'AA' })
  // .preset(presets.shadcn)
  // .addRole('cta', '#ff006e')
  // .addVariant('muted', { from: 'weak' })
  // .addToken('ring', { from: 'accent', emphasis: -0.2 })
`;
}

function PresetPreviewCard({
  color,
  preset,
  label,
  selected,
  onSelect,
}: {
  color: string;
  preset: (typeof GENERATION_PRESETS)[number]['preset'];
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <HextimatorScope
      isolated
      defaultColor={color}
      presets={[preset]}
      darkMode={{ type: 'media-or-class' }}
      className="min-w-0"
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={
          selected
            ? 'flex w-full flex-col gap-2 rounded-xl border-2 border-accent p-3 text-left transition-[border-color,filter,transform] bg-base text-base-foreground shadow-xs hover:brightness-[1.02] active:scale-[0.99]'
            : 'flex w-full flex-col gap-2 rounded-xl border-2 border-base-weak p-3 text-left transition-[border-color,filter,transform] bg-base text-base-foreground shadow-xs hover:brightness-[1.02] active:scale-[0.99]'
        }
      >
        <span className="text-sm font-medium">{label}</span>
        <div className="flex h-9 w-full overflow-hidden rounded-md border border-base-weak">
          <span
            className="min-w-0 flex-1"
            style={{ backgroundColor: 'var(--accent)' }}
          />
          <span
            className="min-w-0 flex-1"
            style={{ backgroundColor: 'var(--accent-weak)' }}
          />
          <span
            className="min-w-0 flex-1"
            style={{ backgroundColor: 'var(--base-weak)' }}
          />
          <span
            className="min-w-0 flex-1"
            style={{ backgroundColor: 'var(--base-strong)' }}
          />
        </div>
      </button>
    </HextimatorScope>
  );
}

export function PresetShowcase({ className }: { className?: string }) {
  const { color, presets: activePresets, setPresets } = useHextimatorTheme();
  const headerClass = styleSelectorFromReactId(useId());

  const selectedId = useMemo(
    () => activeGenerationPresetId(activePresets),
    [activePresets],
  );

  return (
    <section
      className={`flex flex-col gap-4 px-0.5 text-base-foreground ${className ?? ''}`}
      aria-label="Generation presets"
    >
      <HextimatorStyle
        color={color}
        presets={activePresets}
        darkMode={{ type: 'media-or-class' }}
        selector={`.${headerClass}`}
      />
      <div className={`flex flex-col gap-1 ${headerClass}`}>
        <h2 className="text-lg font-bold md:text-xl">Starting point</h2>
        <p className="text-xs font-light leading-snug md:text-sm">
          Choose a style preset for the page and starter code.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {GENERATION_PRESETS.map((entry) => (
          <PresetPreviewCard
            key={entry.id}
            color={color}
            preset={entry.preset}
            label={entry.label}
            selected={selectedId === entry.id}
            onSelect={() => {
              if (selectedId === entry.id) {
                setPresets(undefined);
              } else {
                setPresets([entry.preset]);
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}
