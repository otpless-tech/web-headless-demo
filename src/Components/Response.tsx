import React, { useEffect, useMemo, useState } from "react";

interface ResponseProps {
	responses: Array<any>;
}

interface ResponseItemProps {
	response: any;
	index: number;
}

// very small JSON syntax highlighter (safe: we only highlight JSON we generate)
const highlightJson = (json: string): string => {
    // escape HTML
    const esc = json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // keys: "key":
    const withKeys = esc.replace(/"([^"]+)"(?=\s*:)/g, '<span class="token key">"$1"</span>');

    // strings (values)
    const withStrings = withKeys.replace(/:(\s*)"([^"]*)"(,)?/g, (m, sp, val, comma) => `:${sp}<span class="token string">"${val}"</span>${comma || ""}`);

    // numbers
    const withNumbers = withStrings.replace(/([^\w-])(-?\b\d+(?:\.\d+)?\b)/g, (m, p1, num) => `${p1}<span class="token number">${num}</span>`);

    // booleans/null
    const withLiterals = withNumbers
        .replace(/\b(true|false)\b/g, '<span class="token boolean">$1</span>')
        .replace(/\bnull\b/g, '<span class="token null">null</span>');

    return withLiterals;
};

// Individual response item component (allows hooks)
const ResponseItem: React.FC<ResponseItemProps> = ({ response, index }) => {
	const isString = typeof response === 'string';
	const jsonString = isString ? response : JSON.stringify(response, null, 2);
	const responseType = (response && typeof response === 'object' && 'responseType' in response) ? (response as any).responseType : undefined;

	const highlighted = useMemo(() => highlightJson(jsonString), [jsonString]);
	const [collapsed, setCollapsed] = useState(false);
	// Track copy feedback state
	const [showCopyFeedback, setShowCopyFeedback] = useState(false);
	
	const onCopy = async () => {
		try {
			await navigator.clipboard.writeText(jsonString);
			setShowCopyFeedback(true);
			setTimeout(() => setShowCopyFeedback(false), 1200);
		} catch {
			// no-op
		}
	};
	
	// Badge class based on responseType
	const getBadgeClass = () => {
		if (!responseType) return "";
		
		switch(String(responseType).toUpperCase()) {
			case "VERIFY": return "badge-success";
			case "ONETAP": return "badge-primary";
			case "FAILED": return "badge-danger";
			case "FALLBACK_TRIGGERED": return "badge-warning";
			case "OTP_AUTO_READ": return "badge-info";
			default: return "badge-default";
		}
	};
	
	// Auto-collapse large responses
	const isLarge = jsonString.split("\n").length > 15;
	useEffect(() => {
		if (isLarge) setCollapsed(true);
	}, [isLarge]);
	
	return (
		<div className='response-item'>
			<div className="response-item-header">
				{responseType && (
					<p className="response-heading">
						<span className="response-heading-label">responseType: </span>
						<span className={`response-badge ${getBadgeClass()}`}>{String(responseType)}</span>
					</p>
				)}
				<div className="response-toolbar">
					<button type="button" className="toolbar-btn" onClick={onCopy}>
						{showCopyFeedback ? "Copied!" : "Copy"}
						{showCopyFeedback && <span className="copy-tick">✓</span>}
					</button>
					<button type="button" className="toolbar-btn" onClick={() => setCollapsed(c => !c)}>
						{collapsed ? 'Expand' : 'Collapse'}
					</button>
				</div>
			</div>
			<div className={"response-box" + (collapsed ? " collapsed" : "") }>
				<pre className="response-code" dangerouslySetInnerHTML={{ __html: highlighted }} />
			</div>
		</div>
	);
};

const Response: React.FC<ResponseProps> = ({ responses = [] }) => {
	const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

	const toggleFullScreen = () => {
		const Fn = isFullScreen ? "remove" : "add";

		document.body.classList[Fn]("response-fullscreen-active");

		setIsFullScreen(!isFullScreen);
	};

	useEffect(() => {
		return () => {
			document.body.classList.remove("response-fullscreen-active");
		};
	}, []);

	return (
		<div id="response" className={isFullScreen ? "fullscreen" : ""}>
			<div className="response-header">
				<p className="title">Response: </p>
				<button
					className="fullscreen-button"
					onClick={toggleFullScreen}
					aria-label={isFullScreen ? "Exit fullscreen" : "View fullscreen"}
				>
					{isFullScreen ? (
						<span className="fullscreen-icon">&#x2715;</span>
					) : (
						<span className="fullscreen-icon">&#x26F6;</span>
					)}
				</button>
			</div>
			<div className="response-content">
				{responses.length > 0 ? (
					responses.map((response, index) => (
						<ResponseItem key={index} response={response} index={index} />
					))
				) : (
					<div className="no-responses">No responses yet</div>
				)}
			</div>
		</div>
	);
};

export { Response };
