import DOMPurify from 'dompurify';
import { marked } from 'marked';

export function markdown(text) {
	return DOMPurify.sanitize(
		marked(text, { headerIds: false, breaks: true })
	)
}