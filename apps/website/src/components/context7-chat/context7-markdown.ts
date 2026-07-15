function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function formatInline(value: string) {
	return value
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			(_match, label, href) =>
				/^https?:\/\//i.test(href)
					? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
					: label,
		);
}

export function renderContext7Markdown(content: string) {
	let html = escapeHtml(content);
	html = html.replace(
		/```(\w*)\n([\s\S]*?)```/g,
		(_match, _language, code) => `<pre><code>${code.trim()}</code></pre>`,
	);

	const lines = html.split('\n');
	const blocks: string[] = [];
	let listTag: 'ul' | 'ol' | null = null;
	let paragraph: string[] = [];

	const flushParagraph = () => {
		if (paragraph.length > 0) {
			blocks.push(`<p>${paragraph.join(' ')}</p>`);
			paragraph = [];
		}
	};

	const closeList = () => {
		if (listTag) {
			blocks.push(`</${listTag}>`);
			listTag = null;
		}
	};

	for (const line of lines) {
		if (
			line.startsWith('<pre>') ||
			line.startsWith('</pre>') ||
			line.includes('<pre><code>')
		) {
			flushParagraph();
			closeList();
			blocks.push(line);
			continue;
		}

		const trimmed = line.trim();
		if (!trimmed) {
			flushParagraph();
			closeList();
			continue;
		}

		const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
		if (bulletMatch) {
			flushParagraph();
			if (listTag !== 'ul') {
				closeList();
				blocks.push('<ul>');
				listTag = 'ul';
			}
			blocks.push(`<li>${formatInline(bulletMatch[1])}</li>`);
			continue;
		}

		const orderedMatch = trimmed.match(/^\d+\.\s+(.+)/);
		if (orderedMatch) {
			flushParagraph();
			if (listTag !== 'ol') {
				closeList();
				blocks.push('<ol>');
				listTag = 'ol';
			}
			blocks.push(`<li>${formatInline(orderedMatch[1])}</li>`);
			continue;
		}

		const headingMatch = trimmed.match(/^#{1,4}\s+(.+)/);
		if (headingMatch) {
			flushParagraph();
			closeList();
			blocks.push(`<p><strong>${formatInline(headingMatch[1])}</strong></p>`);
			continue;
		}

		closeList();
		paragraph.push(formatInline(trimmed));
	}

	flushParagraph();
	closeList();
	return blocks.join('');
}
