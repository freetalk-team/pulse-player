// import { videoAnchorRect } from './stores/player';

export function scrollHover(node) {
	const show = () => node.classList.add('scrollbar-active');
	const hide = () => node.classList.remove('scrollbar-active');

	node.addEventListener('mouseenter', show);
	node.addEventListener('mouseleave', hide);

	return {
		destroy() {
			node.removeEventListener('mouseenter', show);
			node.removeEventListener('mouseleave', hide);
		}
	}
}

// actions.js
export function tooltip(node, text) {
	// Move variable INSIDE the function so it's private to each 'node'
	let tooltipEl = null;

	function mouseOver() {
		// 1. Double check to prevent duplicate rendering
		if (tooltipEl) return;

		tooltipEl = document.createElement('div');
		tooltipEl.textContent = text;

		// Pulse-specific styles
		tooltipEl.className = 'fixed z-[9999] px-2 py-1 text-[10px] font-bold text-white bg-gray-800 border border-white/10 rounded pointer-events-none shadow-xl opacity-0 transition-opacity duration-200 whitespace-nowrap';

		document.body.appendChild(tooltipEl);

		// 2. Position logic
		const { top, left, width } = node.getBoundingClientRect();
		
		tooltipEl.style.top = `${top - 30}px`;
		tooltipEl.style.left = `${left + width / 2}px`;
		tooltipEl.style.transform = 'translateX(-50%)';

		// requestAnimationFrame(() => {
		// 	if (!tooltipEl) return;

		// 	const rect = tooltipEl.getBoundingClientRect();
		// 	const padding = 8;

		// 	console.log('RECT', rect.right, window.innerWidth);

		// 	if (rect.right > window.innerWidth - padding) {
		// 		const shift = rect.right - window.innerWidth + padding;

		// 		// move tooltip left by adjusting translate
		// 		tooltipEl.style.transform = `translateX(calc(-50% - ${shift}px))`;
		// 	}
		// });

		// 3. Trigger fade in (using setTimeout to ensure it hits next tick)
		setTimeout(() => {
			if (tooltipEl) tooltipEl.classList.remove('opacity-0');
		}, 0);
	}

	function mouseLeave() {
		if (tooltipEl) {
			tooltipEl.remove();
			tooltipEl = null; // Reset to null for next hover
		}
	}

	node.addEventListener('mouseenter', mouseOver); // 'mouseenter' is cleaner than 'mouseover'
	node.addEventListener('mouseleave', mouseLeave);

	return {
		// 4. Update the text if it changes reactively
		update(newText) {
			text = newText;
			if (tooltipEl) tooltipEl.textContent = text;
		},
		// 5. Cleanup when the component is destroyed
		destroy() {
			node.removeEventListener('mouseenter', mouseOver);
			node.removeEventListener('mouseleave', mouseLeave);
			if (tooltipEl) {
				tooltipEl.remove();
				tooltipEl = null;
			}
		}
	};
}

// actions.js
export function clickOutside(node, options) {
	const handleClick = (event) => {
		const target = event.target;
		
		// 1. Determine if we are using the simple function or the object config
		const isFunction = typeof options === 'function';
		const callback = isFunction ? options : options.callback;
		// 2. ALWAYS look at the current value of the exclude array
		const exclude = isFunction ? [] : (options.exclude || []);

		// 3. Check if click is inside the main node
		if (node && node.contains(target)) return;

		// 4. Check if click is inside any currently active excluded nodes
		for (const el of exclude) {
			if (el && el.contains(target)) return;
		}

		// 5. If it reached here and it's a valid outside click, fire the callback
		if (callback && !event.defaultPrevented) {
			callback();
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}

export function portal(node) {
	document.body.appendChild(node);
	return {
		destroy() {
			if (node.parentNode) node.parentNode.removeChild(node);
		}
	};
}

export let draggingType = null;

export function startDragging(event, items, type) {

	draggingType = type;

	event.dataTransfer.setData(`pulse/${type}`, JSON.stringify(items));
	event.dataTransfer.effectAllowed = 'copy';

	if (items.length > 1) {
		// Create a small badge that says "Moving X items"
		const ghost = document.createElement('div');
		ghost.style.position = 'absolute';
		ghost.style.top = '-1000px'; // Hidden but in DOM
		ghost.style.padding = '8px 16px';
		ghost.style.background = '#22c55e'; // Your pulse-accent
		ghost.style.color = 'black';
		ghost.style.borderRadius = '20px';
		ghost.style.fontWeight = 'bold';
		ghost.style.fontSize = '12px';
		ghost.innerHTML = `Moving ${items.length} ${type}`;
		
		document.body.appendChild(ghost);
		
		// Offset (10, 10) puts the cursor in the top-left of the badge
		event.dataTransfer.setDragImage(ghost, 10, 10);
		
		// Remove it on the next tick so it doesn't stay in the DOM
		setTimeout(() => document.body.removeChild(ghost), 0);
	}

	document.body.classList.add('is-dragging-track');
}

export function stopDragging() {
	draggingType = null;
	document.body.classList.remove('is-dragging-track');
}

// export function videoAnchor(node) {
//     let frame;

//     function update() {
//         const rect = node.getBoundingClientRect();
		
//         // We only update if the values actually changed to save CPU
//         videoAnchorRect.update(prev => {
//             if (prev && 
//                 prev.top === rect.top && 
//                 prev.left === rect.left && 
//                 prev.width === rect.width) {
//                 return prev;
//             }
//             return {
//                 top: rect.top,
//                 left: rect.left,
//                 width: rect.width,
//                 height: rect.height
//             };
//         });

//         frame = requestAnimationFrame(update);
//     }

//     // Start the tracking loop
//     frame = requestAnimationFrame(update);

//     return {
//         destroy() {
//             cancelAnimationFrame(frame);
//             videoAnchorRect.set(null);
//         }
//     };
// }