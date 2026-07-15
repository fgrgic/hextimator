import type { ReactNode } from 'react';

function parseInline(text: string, keyPrefix: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	const pattern =
		/(`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/g;
	let lastIndex = 0;
	let index = 0;

	for (const match of text.matchAll(pattern)) {
		const matchIndex = match.index ?? 0;
		if (matchIndex > lastIndex) {
			nodes.push(text.slice(lastIndex, matchIndex));
		}

		const key = `${keyPrefix}-${index++}`;
		if (match[2]) {
			nodes.push(<code key={key}>{match[2]}</code>);
		} else if (match[3]) {
			nodes.push(<strong key={key}>{match[3]}</strong>);
		} else if (match[4]) {
			nodes.push(<em key={key}>{match[4]}</em>);
		} else if (match[5] && match[6] && /^https?:\/\//i.test(match[6])) {
			nodes.push(
				<a key={key} href={match[6]} target="_blank" rel="noopener noreferrer">
					{match[5]}
				</a>,
			);
		} else if (match[5]) {
			nodes.push(match[5]);
		}

		lastIndex = matchIndex + match[0].length;
	}

	if (lastIndex < text.length) {
		nodes.push(text.slice(lastIndex));
	}

	return nodes;
}

export function Context7Markdown({ content }: { content: string }) {
	const blocks: ReactNode[] = [];
	const codeBlocks = content.split(/(```[\s\S]*?```)/g);
	let blockIndex = 0;

	for (const segment of codeBlocks) {
		if (segment.startsWith('```')) {
			const code = segment.replace(/^```\w*\n?/, '').replace(/```$/, '').trim();
			blocks.push(
				<pre key={`block-${blockIndex++}`}>
					<code>{code}</code>
				</pre>,
			);
			continue;
		}

		const lines = segment.split('\n');
		let listTag: 'ul' | 'ol' | null = null;
		let listItems: ReactNode[] = [];
		let paragraph: string[] = [];

		const flushParagraph = () => {
			if (paragraph.length === 0) return;
			const key = `block-${blockIndex++}`;
			blocks.push(
				<p key={key}>{parseInline(paragraph.join(' '), key)}</p>,
			);
			paragraph = [];
		};

		const closeList = () => {
			if (!listTag) return;
			const key = `block-${blockIndex++}`;
			if (listTag === 'ul') {
				blocks.push(<ul key={key}>{listItems}</ul>);
			} else {
				blocks.push(<ol key={key}>{listItems}</ol>);
			}
			listTag = null;
			listItems = [];
		};

		for (const line of lines) {
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
					listTag = 'ul';
				}
				const key = `item-${blockIndex}-${listItems.length}`;
				listItems.push(
					<li key={key}>{parseInline(bulletMatch[1], key)}</li>,
				);
				continue;
			}

			const orderedMatch = trimmed.match(/^\d+\.\s+(.+)/);
			if (orderedMatch) {
				flushParagraph();
				if (listTag !== 'ol') {
					closeList();
					listTag = 'ol';
				}
				const key = `item-${blockIndex}-${listItems.length}`;
				listItems.push(
					<li key={key}>{parseInline(orderedMatch[1], key)}</li>,
				);
				continue;
			}

			const headingMatch = trimmed.match(/^#{1,4}\s+(.+)/);
			if (headingMatch) {
				flushParagraph();
				closeList();
				const key = `block-${blockIndex++}`;
				blocks.push(
					<p key={key}>
						<strong>{parseInline(headingMatch[1], key)}</strong>
					</p>,
				);
				continue;
			}

			closeList();
			paragraph.push(trimmed);
		}

		flushParagraph();
		closeList();
	}

	return (
		<div className="context7-markdown min-w-0 max-w-full wrap-break-word [&_a]:break-all [&_a]:underline [&_code]:break-all [&_code]:rounded [&_code]:bg-surface-strong [&_code]:px-1 [&_pre]:mt-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface-strong [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2">
			{blocks}
		</div>
	);
}
