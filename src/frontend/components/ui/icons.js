
export const Icons = [
	'fa-music', 'fa-headphones', 'fa-record-vinyl', 'fa-compact-disc',
	'fa-heart', 'fa-star', 'fa-fire', 'fa-bolt',
	'fa-moon', 'fa-sun', 'fa-cloud', 'fa-snowflake', 
	'fa-dumbbell', 'fa-running', 'fa-bicycle', 'fa-gamepad',
	'fa-guitar', 'fa-drum', 'fa-microphone', 'fa-radio',
	'fa-coffee', 'fa-cocktail', 'fa-pizza-slice', 'fa-leaf',
];

export const Colors = {
    blue: 'var(--color-blue-400)',
    red: 'var(--color-red-400)',
    accent: 'var(--color-pulse-accent)',
    indigo: 'var(--color-indigo-400)',
    purple: 'var(--color-purple-400)',
    rose: 'var(--color-rose-400)',
    orange: 'var(--color-orange-400)',
    amber: 'var(--color-amber-400)',
    emerald: 'var(--color-emerald-400)',
    slate: 'var(--color-slate-400)',
    violet: 'var(--color-violet-400)'
};

export function randomIcon() {
    return Icons[Math.floor(Math.random() * Icons.length)];
}

export function randomColor(type='text') {
    const colors = [...Object.keys(Colors)];
    return colors[Math.floor(Math.random() * colors.length)];
}

export function icon(icolor) {
    const [fa, color] = icolor.split(' ');
    return `<i class="fa-solid ${fa}" style="color:${Colors[color || 'slate']}"></i>`;
}