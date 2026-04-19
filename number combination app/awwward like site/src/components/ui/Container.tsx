import { cn } from "@/lib/utils";
import React from "react";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "mx-auto w-full max-w-[1400px] px-4 md:px-6 lg:px-8",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Container.displayName = "Container";

export { Container };
