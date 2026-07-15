export const CONTEXT7_LIBRARY = '/fgrgic/hextimator';
export const CONTEXT7_API_URL = 'https://context7.com';
export const CONTEXT7_PLACEHOLDER = 'Ask about hextimator...';
export const CONTEXT7_WELCOME_MESSAGE =
	"Hello! I'm here to help you with hextimator. Ask about setup, usage, presets, or anything else from the docs.";

export type Context7ChatMessage = {
	id: string;
	role: 'user' | 'assistant';
	content: string;
};

type StreamHandlers = {
	onChunk: (delta: string) => void;
	onToolCall: (query: string) => void;
	onToolResult: () => void;
	onDone: () => void;
	onError: (message: string) => void;
};

function ownerSettingsMessage(message: string) {
	return `${message}\n\nIf you are the library owner, check your widget settings on Context7. Otherwise, please reach out to the owner of this page to update their chat configuration on Context7.`;
}

export async function streamContext7Chat(
	messages: Context7ChatMessage[],
	handlers: StreamHandlers,
) {
	const payload = messages.map((message) => ({
		id: message.id,
		role: message.role,
		content: message.content,
		parts: [{ type: 'text', text: message.content }],
	}));

	let response: Response;
	try {
		response = await fetch(`${CONTEXT7_API_URL}/api/v2/widget/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: payload,
				libraryName: CONTEXT7_LIBRARY,
			}),
		});
	} catch {
		handlers.onError(
			ownerSettingsMessage('Unable to connect to the chat service.'),
		);
		return;
	}

	if (!response.ok) {
		let message = '';
		try {
			const body = (await response.json()) as { message?: string };
			if (body.message === 'Widget is not enabled') {
				message = 'The chat widget is not enabled for this library.';
			} else if (body.message === 'Origin not allowed') {
				message = 'This domain is not authorized to use the chat widget.';
			} else if (body.message) {
				message = body.message;
			}
		} catch {
			// ignore parse errors
		}

		handlers.onError(ownerSettingsMessage(message || 'Something went wrong.'));
		return;
	}

	const reader = response.body?.getReader();
	if (!reader) {
		handlers.onError('No response stream.');
		return;
	}

	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;

				if (trimmed.startsWith('data: ')) {
					try {
						const event = JSON.parse(trimmed.slice(6)) as {
							type?: string;
							delta?: string;
							toolCallId?: string;
							toolName?: string;
							input?: { query?: string };
							output?: unknown;
						};

						if (event.type === 'text-delta' && event.delta) {
							handlers.onChunk(event.delta);
						} else if (event.type === 'tool-input-available') {
							handlers.onToolCall(event.input?.query ?? 'documentation');
						} else if (event.type === 'tool-output-available') {
							handlers.onToolResult();
						}
					} catch {
						// ignore malformed events
					}
					continue;
				}

				const separatorIndex = trimmed.indexOf(':');
				if (separatorIndex === -1) continue;

				const type = trimmed.slice(0, separatorIndex);
				const value = trimmed.slice(separatorIndex + 1);
				if (type === '0') {
					try {
						handlers.onChunk(JSON.parse(value) as string);
					} catch {
						// ignore malformed chunks
					}
				}
			}
		}
	} catch {
		handlers.onError('Stream interrupted.');
		return;
	} finally {
		handlers.onDone();
	}
}
