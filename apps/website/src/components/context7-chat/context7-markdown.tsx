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

function isTableRow(line: string) {
	const trimmed = line.trim();
	return trimmed.startsWith('|') && trimmed.endsWith('|');
}

function parseTableCells(line: string) {
	return line
		.trim()
		.split('|')
		.slice(1, -1)
		.map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]) {
	return (
		cells.length > 0 &&
		cells.every((cell) => /^:?-{3,}:?$/.test(cell))
	);
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
		let tableLines: string[] = [];

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

		const flushTable = () => {
			if (tableLines.length === 0) return;
			const savedLines = [...tableLines];
			tableLines = [];
			const rows = savedLines.map(parseTableCells);

			if (rows.length >= 2 && isSeparatorRow(rows[1])) {
				const key = `block-${blockIndex++}`;
				const headerCells = rows[0];
				const bodyRows = rows.slice(2);
				blocks.push(
					<div key={key} className="mt-2 max-w-full overflow-x-auto">
						<table className="w-full border-collapse text-sm">
							<thead>
								<tr>
									{headerCells.map((cell) => {
										const cellKey = `${key}-h-${cell}`;
										return (
											<th
												key={cellKey}
												className="border border-surface-weak bg-surface-strong px-2 py-1 text-left font-medium"
											>
												{parseInline(cell, cellKey)}
											</th>
										);
									})}
								</tr>
							</thead>
							<tbody>
								{bodyRows.map((row) => {
									const rowKey = `${key}-r-${row.join('|')}`;
									return (
										<tr key={rowKey}>
											{row.map((cell, cellIndex) => {
												const cellKey = `${rowKey}-c-${headerCells[cellIndex] ?? cell}`;
												return (
													<td
														key={cellKey}
														className="border border-surface-weak px-2 py-1 align-top"
													>
														{parseInline(cell, cellKey)}
													</td>
												);
											})}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>,
				);
				return;
			}

			for (const line of savedLines) {
				paragraph.push(line);
				flushParagraph();
			}
		};

		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) {
				flushTable();
				flushParagraph();
				closeList();
				continue;
			}

			if (isTableRow(trimmed)) {
				flushParagraph();
				closeList();
				tableLines.push(trimmed);
				continue;
			}

			if (tableLines.length > 0) {
				flushTable();
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

		flushTable();
		flushParagraph();
		closeList();
	}

	return (
		<div className="context7-markdown min-w-0 max-w-full wrap-break-word [&_a]:break-all [&_a]:underline [&_code]:break-all [&_code]:rounded [&_code]:bg-surface-strong [&_code]:px-1 [&_pre]:mt-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-surface-strong [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-2">
			{blocks}
		</div>
	);
}
