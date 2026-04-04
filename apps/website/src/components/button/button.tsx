import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef, ComponentType, SVGProps } from 'react';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
	'flex items-center justify-center rounded-md cursor-pointer gap-2 text-sm leading-none transition-background duration-200',
	{
		variants: {
			variant: {
				primary:
					'px-4 py-2 bg-accent text-accent-foreground min-w-32 hover:bg-accent-weak',
				ghost:
					'flex-row-reverse px-2 py-0 bg-transparent text-base-foreground text-sm justify-center',
				navigation:
					'flex-row px-2 py-1 bg-transparent text-base-foreground text-sm justify-center hover:bg-base-weak whitespace-nowrap',
			},
		},
		defaultVariants: {
			variant: 'primary',
		},
	},
);

type SharedProps = VariantProps<typeof buttonVariants> & {
	icon?: ComponentType<SVGProps<SVGSVGElement>>;
	iconProps?: SVGProps<SVGSVGElement>;
};

type ButtonAsButton = SharedProps &
	ComponentPropsWithRef<'button'> & { href?: never };
type ButtonAsAnchor = SharedProps &
	ComponentPropsWithRef<'a'> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export function Button({
	variant,
	className,
	icon: Icon,
	iconProps,
	href,
	...props
}: ButtonProps) {
	const classes = buttonVariants({
		variant,
		className,
	});

	const iconSize =
		variant === 'ghost' || variant === 'navigation' ? '0.875rem' : '1rem';

	const children = (
		<>
			{props.children}
			{Icon && (
				<span className="shrink-0 inline-flex">
					<Icon
						width={iconSize}
						height={iconSize}
						strokeWidth={2}
						className={iconProps?.className}
						{...iconProps}
					/>
				</span>
			)}
		</>
	);

	if (href) {
		return (
			<a
				href={href}
				className={classes}
				{...(props as ComponentPropsWithRef<'a'>)}
			>
				{children}
			</a>
		);
	}

	return (
		<button className={classes} {...(props as ComponentPropsWithRef<'button'>)}>
			{children}
		</button>
	);
}
