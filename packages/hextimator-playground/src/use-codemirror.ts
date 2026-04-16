import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { toggleComment } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { hextimatorCompletions } from './completions';

type UseCodeMirrorOptions = {
  initialValue: string;
  onChange: (value: string) => void;
  fontSize?: number | string;
};

export function useCodeMirror({
  initialValue,
  onChange,
  fontSize = 14,
}: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        lineNumbers(),
        javascript(),
        closeBrackets(),
        autocompletion({
          override: [hextimatorCompletions],
          activateOnTyping: true,
        }),
        oneDark,
        placeholder('Write your hextimator code here...'),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.contentAttributes.of({
          'aria-label': 'Code editor',
        }),
        EditorView.theme(
          {
            '&': {
              fontSize:
                typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
              height: '100%',
            },
            '.cm-content': {
              padding: '0.75em 0',
            },
            '.cm-gutters': {
              border: 'none',
              paddingRight: '0.5em',
            },
            '.cm-lineNumbers .cm-gutterElement': {
              paddingLeft: '0.75em',
              paddingRight: '0.5em',
            },
          },
          { dark: true },
        ),
        keymap.of([
          {
            key: 'Mod-/',
            run: toggleComment,
          },
          {
            key: 'Tab',
            run: (view) => {
              view.dispatch(
                view.state.update(view.state.replaceSelection('  '), {
                  scrollIntoView: true,
                  userEvent: 'input',
                }),
              );
              return true;
            },
          },
        ]),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [initialValue, fontSize]);

  return { containerRef, viewRef };
}
