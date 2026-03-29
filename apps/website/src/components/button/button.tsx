import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentPropsWithRef, ComponentType, SVGProps } from 'react';

const buttonVariants = cva('flex items-center rounded-md cursor-pointer', {
	variants: {
		variant: {
			primary: 'px-4 py-2 bg-accent text-accent-foreground min-w-32',
			secondary: 'px-4 py-2 bg-secondary text-secondary-foreground',
			ghost: 'px-2 py-0 bg-transparent text-base-foreground text-sm',
		},
	},
	defaultVariants: {
		variant: 'primary',
	},
});

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
		className:
			`${Icon ? 'justify-between pr-2' : 'justify-center'} ${className ?? ''}`.trim() ||
			undefined,
	});

	const children = (
		<>
			{props.children}
			{Icon && <Icon width="1.5rem" strokeWidth={1.5} {...iconProps} />}
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
