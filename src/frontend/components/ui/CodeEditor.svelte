<script>
  import { onMount, onDestroy } from 'svelte';
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap } from '@codemirror/view';
  import { defaultKeymap } from '@codemirror/commands';
  import { javascript } from '@codemirror/lang-javascript';
  import { oneDark } from '@codemirror/theme-one-dark';
  import { lineNumbers } from '@codemirror/view';

  import { createAutocomplete } from './editorAutocomplete';

  export let value = '';
  export let schema = [];
  export let readonly = false;
  export let onChange = () => {};

  let editorEl;
  let view;

const noInternalScroll = EditorView.theme({
  "&": {
    height: "auto"
  },
  ".cm-scroller": {
    overflow: "visible !important",
    height: "auto !important"
  },
  ".cm-content": {
    height: "auto !important"
  }
});


const backgroundOverride = EditorView.theme({
	"&": {
		backgroundColor: "transparent !important"
	},
	"&.cm-editor": {
		backgroundColor: "#111111aa !important"
	},
	".cm-scroller": {
		backgroundColor: "transparent !important"
	},
	".cm-content": {
		backgroundColor: "transparent !important"
	}
});

  onMount(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
		lineNumbers(),
        keymap.of(defaultKeymap),
        javascript(),
        oneDark,
		backgroundOverride,
		createAutocomplete(schema),
		// noInternalScroll,
		// EditorView.contentAttributes.of({
        // 	style: "height: auto"
      	// }),
		EditorState.readOnly.of(readonly),
		EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const val = update.state.doc.toString();
            onChange(val);
          }
        })
      ]
    });

    view = new EditorView({
      	state,
      	parent: editorEl,
	});
  });

  onDestroy(() => {
    view?.destroy();
  });
</script>

<div bind:this={editorEl} class="editor"></div>

<style>


.editor {
    height: 100%;
    /* height: auto; */
	/* display: flex; */
    border: 1px solid #2a2a2a;
    border-radius: 4px;
    overflow: hidden;
}

:global(.cm-editor),
:global(.cm-scroller) {
  	height: 100%;
}

/* :global(.cm-content.cm-focused) {
  	background-color: transparent !important;
} */

:global(.cm-scroller) {
  scrollbar-width: thin;
  scrollbar-color: #4b5563 transparent;
}

:global(.cm-scroller::-webkit-scrollbar) {
  width: 10px;
}

:global(.cm-scroller::-webkit-scrollbar-thumb) {
  background: #374151;
  border-radius: 8px;
}

:global(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: #4b5563;
}


/* kill CodeMirror internal scrolling */
/* :global(.cm-scroller) {
  	overflow: visible !important;
  	height: auto !important;
}

:global(.cm-content),
:global(.cm-editor) {
  	height: auto !important;
} */


</style>