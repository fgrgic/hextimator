import { type ComponentPropsWithRef, type ReactNode, useState } from 'react';
import { cn } from '../../utils/cn';

type BentoCardProps = ComponentPropsWithRef<'div'> & {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  visual?: ReactNode;
  span?: 'default' | 'wide' | 'tall' | 'large';
  rotate?: boolean;
};

const spanClasses = {
  default: '',
  wide: 'md:col-span-2',
  tall: 'md:row-span-2',
  large: 'md:col-span-2 md:row-span-2',
} as const;

export function BentoCard({
  title,
  description,
  icon,
  visual,
  span = 'default',
  children,
  rotate = false,
  ...rest
}: BentoCardProps) {
  const [rotation] = useState(() => {
    if (!rotate) return 0;
    const sign = Math.random() < 0.5 ? -1 : 1;
    const value = Math.round((Math.random() * 0.4 + 0.4) * 10) / 10;
    return sign * value;
  });
  return (
    <div
      {...rest}
      style={
        {
          '--card-rotation': `${rotation}deg`,
          ...rest.style,
        } as React.CSSProperties
      }
      className={cn(
        'group relative flex flex-col gap-4 rounded-xl border border-base-weak bg-base-strong hover:border-base hover:shadow-lg p-6 -mx-2 md:mx-0 text-base-foreground overflow-hidden hover:[transform:rotate(var(--card-rotation))]',
        spanClasses[span],
        rest.className,
      )}
    >
      {icon && (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent text-accent-foreground">
          {icon}
        </div>
      )}
      {visual}
      <div className="flex flex-col gap-1">
        <h3 className="text-lg">{title}</h3>
        {description && typeof description === 'string' ? (
          <p className="text-sm font-light opacity-80">{description}</p>
        ) : (
          description
        )}
      </div>
      {children && <div className="flex-1">{children}</div>}
    </div>
  );
}

export function BentoGrid({ children, ...rest }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      {...rest}
      className={cn(
        'grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl',
        rest.className,
      )}
    >
      {children}
    </div>
  );
}
