export const AuthBackground = ({children}: {children: React.ReactNode}): React.ReactNode => {
    return (
        <div className="min-h-screen w-full bg-white relative overflow-x-hidden transition-colors duration-300">
  {/* Noise Texture (Darker Dots) Background */}
            <div
                className="absolute inset-0 z-0 dark:hidden"
                style={{
                background: "#ffffff",
                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.35) 1px, transparent 0)",
                backgroundSize: "20px 20px",
                }}
            />
            {/* Dark White Dotted Grid Background */}
            <div
                className="absolute inset-0 z-0 hidden dark:block"
                style={{
                background: "#06080e",
                backgroundImage: `
                    radial-gradient(circle, rgba(255, 255, 255, 0.2) 1.5px, transparent 1.5px)
                `,
                backgroundSize: "30px 30px",
                backgroundPosition: "0 0",
                }}
            />

     {/* Your Content/Components */}
        <div className="relative z-10">
            {children}
        </div>
</div>
    );
}
