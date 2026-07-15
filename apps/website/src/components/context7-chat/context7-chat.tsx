import '@hextimator/playground/style.css';
import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../button';
import { InteractiveCard } from '../interactive/interactive-card';
import {
	CONTEXT7_PLACEHOLDER,
	CONTEXT7_WELCOME_MESSAGE,
	type Context7ChatMessage,
	streamContext7Chat,
} from './context7-client';
import { Context7Markdown } from './context7-markdown';

let messageCounter = 0;

function createMessageId() {
	messageCounter += 1;
	return `c7-${messageCounter}`;
}

function createWelcomeMessage(): Context7ChatMessage {
	return {
		id: createMessageId(),
		role: 'assistant',
		content: CONTEXT7_WELCOME_MESSAGE,
	};
}

export function Context7Chat() {
	const [messages, setMessages] = useState<Context7ChatMessage[]>([
		createWelcomeMessage(),
	]);
	const [input, setInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState<string | null>(null);
	const messagesRef = useRef<HTMLDivElement>(null);
	const composingRef = useRef(false);
	const lastMessageContentLength = messages.at(-1)?.content.length ?? 0;

	useLayoutEffect(() => {
		const container = messagesRef.current;
		if (
			!container ||
			(messages.length === 0 &&
				lastMessageContentLength === 0 &&
				!isLoading &&
				searchQuery == null)
		) {
			return;
		}

		container.scrollTop = container.scrollHeight;
	}, [messages.length, lastMessageContentLength, isLoading, searchQuery]);

	const sendMessage = async () => {
		const content = input.trim();
		if (!content || isLoading) return;

		const userMessage: Context7ChatMessage = {
			id: createMessageId(),
			role: 'user',
			content,
		};
		const nextMessages = [...messages, userMessage];

		setMessages(nextMessages);
		setInput('');
		setIsLoading(true);
		setSearchQuery(null);

		let assistantContent = '';
		const assistantId = createMessageId();

		await streamContext7Chat(nextMessages, {
			onChunk: (delta) => {
				assistantContent += delta;
				setSearchQuery(null);
				setMessages((current) => {
					const withoutAssistant = current.filter(
						(message) => message.id !== assistantId,
					);
					return [
						...withoutAssistant,
						{
							id: assistantId,
							role: 'assistant',
							content: assistantContent,
						},
					];
				});
			},
			onToolCall: (query) => {
				setSearchQuery(query);
			},
			onToolResult: () => {
				setSearchQuery(null);
			},
			onDone: () => {
				setIsLoading(false);
				setSearchQuery(null);
			},
			onError: (message) => {
				setIsLoading(false);
				setSearchQuery(null);
				setMessages((current) => [
					...current,
					{
						id: createMessageId(),
						role: 'assistant',
						content: message,
					},
				]);
			},
		});
	};

	return (
		<InteractiveCard className="overflow-hidden p-0">
			<div className="hxp-pane-header">
				<div className="hxp-pane-header-left">
					<div className="hxp-traffic-dots">
						<span className="hxp-dot hxp-dot-red" />
						<span className="hxp-dot hxp-dot-yellow" />
						<span className="hxp-dot hxp-dot-green" />
					</div>
					<span className="hxp-pane-title">hextimator.chat</span>
				</div>
			</div>
			<div className="flex h-112 flex-col">
				<div
					ref={messagesRef}
					className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
				>
					{messages.map((message) => (
						<div
							key={message.id}
							className={cn(
								'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
								message.role === 'user'
									? 'self-end bg-accent text-accent-foreground'
									: 'self-start bg-surface text-surface-foreground',
							)}
						>
							{message.role === 'assistant' ? (
								<Context7Markdown content={message.content} />
							) : (
								<p className="whitespace-pre-wrap">{message.content}</p>
							)}
						</div>
					))}

					{searchQuery ? (
						<p className="self-start text-xs text-surface-foreground/70">
							Searching: {searchQuery}
						</p>
					) : null}

					{isLoading && !searchQuery ? (
						<p className="self-start text-xs text-surface-foreground/70">
							Thinking...
						</p>
					) : null}
				</div>

				<form
					className="flex gap-2 border-t border-surface-weak bg-surface-strong p-3"
					onSubmit={(event) => {
						event.preventDefault();
						void sendMessage();
					}}
				>
					<input
						value={input}
						onChange={(event) => setInput(event.target.value)}
						onCompositionStart={() => {
							composingRef.current = true;
						}}
						onCompositionEnd={() => {
							setTimeout(() => {
								composingRef.current = false;
							}, 0);
						}}
						onKeyDown={(event) => {
							if (
								composingRef.current ||
								event.nativeEvent.isComposing ||
								event.key !== 'Enter' ||
								event.shiftKey
							) {
								return;
							}

							event.preventDefault();
							void sendMessage();
						}}
						placeholder={CONTEXT7_PLACEHOLDER}
						disabled={isLoading}
						className="min-w-0 flex-1 rounded-lg border border-surface-weak bg-surface px-3 py-2 text-sm text-surface-foreground outline-none transition-colors focus:border-accent"
					/>
					<Button type="submit" disabled={isLoading || !input.trim()}>
						Send
					</Button>
				</form>
			</div>
		</InteractiveCard>
	);
}
