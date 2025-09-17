// Lightweight syntax highlighting for JSON in DOM
const highlightJsonDom = (json: string): string => {
    // Escape HTML
    const esc = json
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Apply syntax highlighting
    return esc
        // keys
        .replace(/"([^"]+)"(?=\s*:)/g, '<span class="token key">"$1"</span>')
        // strings (values)
        .replace(/:(\s*)"([^"]*)"(,)?/g, (m, sp, val, comma) => 
            `:${sp}<span class="token string">"${val}"</span>${comma || ""}`)
        // numbers
        .replace(/([^\w-])(-?\b\d+(?:\.\d+)?\b)/g, (m, p1, num) => 
            `${p1}<span class="token number">${num}</span>`)
        // booleans
        .replace(/\b(true|false)\b/g, '<span class="token boolean">$1</span>')
        // null
        .replace(/\bnull\b/g, '<span class="token null">null</span>');
};

// Badge class based on responseType
const getBadgeClass = (responseType: string | undefined): string => {
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

export const appendResponse = (response: any): void => {
    const input = document.getElementById('response');
    if (!input || response == null) return;

    // Outer container per response item
    const container = document.createElement('div');
    container.classList.add('response-item');
    
    const header = document.createElement('div');
    header.classList.add('response-item-header');
    container.appendChild(header);

    // Optional heading with badge
    const responseType = (response && typeof response === 'object' && 'responseType' in response) ? 
        (response as any).responseType : undefined;
        
    if (responseType) {
        const heading = document.createElement('p');
        heading.classList.add('response-heading');

        const label = document.createElement('span');
        label.classList.add('response-heading-label');
        label.textContent = 'responseType: ';
        heading.appendChild(label);

        // Badge for responseType
        const badge = document.createElement('span');
        badge.classList.add('response-badge');
        badge.classList.add(getBadgeClass(responseType));
        badge.textContent = String(responseType);
        heading.appendChild(badge);
        
        header.appendChild(heading);
    }

    // Add toolbar
    const toolbar = document.createElement('div');
    toolbar.classList.add('response-toolbar');
    header.appendChild(toolbar);
    
    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.classList.add('toolbar-btn');
    copyBtn.textContent = 'Copy';
    copyBtn.onclick = async () => {
        try {
            const jsonString = typeof response === 'string' ? 
                response : JSON.stringify(response, null, 2);
            await navigator.clipboard.writeText(jsonString);
            
            // Show feedback
            const origText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            
            const tick = document.createElement('span');
            tick.classList.add('copy-tick');
            tick.textContent = '✓';
            copyBtn.appendChild(tick);
            
            setTimeout(() => {
                copyBtn.textContent = origText;
            }, 1200);
        } catch {}
    };
    toolbar.appendChild(copyBtn);
    
    // Collapse button
    const collapseBtn = document.createElement('button');
    collapseBtn.type = 'button';
    collapseBtn.classList.add('toolbar-btn');
    collapseBtn.textContent = 'Collapse';
    
    // JSON content
    const pretty = typeof response === 'string' ? response : JSON.stringify(response, null, 2);
    const isLarge = pretty.split('\n').length > 15;
    
    // Pretty JSON block with highlighting
    const box = document.createElement('div');
    box.classList.add('response-box');
    if (isLarge) {
        box.classList.add('collapsed');
        collapseBtn.textContent = 'Expand';
    }
    
    collapseBtn.onclick = () => {
        box.classList.toggle('collapsed');
        collapseBtn.textContent = box.classList.contains('collapsed') ? 'Expand' : 'Collapse';
    };
    toolbar.appendChild(collapseBtn);
    
    const pre = document.createElement('pre');
    pre.classList.add('response-code');
    pre.innerHTML = highlightJsonDom(pretty);
    box.appendChild(pre);
    container.appendChild(box);

    input.appendChild(container);
}
