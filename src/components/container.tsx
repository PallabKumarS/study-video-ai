import type React from "react";

interface ContainerProps {
	children: React.ReactNode;
	className?: string;
	id?: string;
}

export function Container({ children, className = "", id }: ContainerProps) {
	return (
		<div
			id={id}
			className={`w-[96%] sm:w-[94%] md:w-[92%] lg:w-[90%] max-w-[1920px] mx-auto ${className}`}
		>
			{children}
		</div>
	);
}
