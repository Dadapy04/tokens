export function AuthCardDashes() {
    const svgStyle = {
        width: '200vw',
        height: '200vh',
    };

    return (
        <>
            <svg
                aria-hidden="true"
                className="absolute pointer-events-none z-0 transition-all duration-300"
                style={{
                    left: '0%',
                    top: '0%',
                    transform: 'translate(-50%, -50%)',
                    ...svgStyle,
                }}
            >
                <line
                    x1="0"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                    className="stroke-border-low group-hover:stroke-border-medium transition-all duration-300"
                    strokeWidth={1}
                    strokeDasharray="7 7"
                />
                <line
                    x1="50%"
                    y1="0"
                    x2="50%"
                    y2="100%"
                    className="stroke-border-low group-hover:stroke-border-medium transition-all duration-300"
                    strokeWidth={1}
                    strokeDasharray="7 7"
                />
            </svg>

            <svg
                aria-hidden="true"
                className="absolute pointer-events-none z-0 transition-all duration-300"
                style={{
                    left: '100%',
                    top: '100%',
                    transform: 'translate(-50%, -50%)',
                    ...svgStyle,
                }}
            >
                <line
                    x1="0"
                    y1="50%"
                    x2="100%"
                    y2="50%"
                    className="stroke-border-low group-hover:stroke-border-medium transition-all duration-300"
                    strokeWidth={1}
                    strokeDasharray="7 7"
                />
                <line
                    x1="50%"
                    y1="0"
                    x2="50%"
                    y2="100%"
                    className="stroke-border-low group-hover:stroke-border-medium transition-all duration-300"
                    strokeWidth={1}
                    strokeDasharray="7 7"
                />
            </svg>
        </>
    );
}
