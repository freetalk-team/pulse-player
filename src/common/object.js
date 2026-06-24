Object.toArray = function(o, cb=function(){}) {
	const a = [];

	if (o) {
		for (const [id, i] of Object.entries(o)) {
			i.id = i.id || id;
			cb(i);
			a.push(i);
		}
	}

	return a;
}

Object.fromArray = function(a) {
	const r = {};
	for (const i of a)
		r[i.id] = i;

	return r;
}

Object.empty = function(o) {
	return Object.keys(o).length === 0 && o.constructor === Object;
}

Object.clean = function(o) {
	Object.keys(o).forEach(i => (o[i] === undefined || o[i] === null) && delete o[i]);
	return o;
}

Object.flipEntries = function(o) {
	return Object.fromEntries(Object.entries(o).map(([k,v]) => [v,k]));
}

Object.hash = function(o) {

	let n = 4294967279;

	for (const v of Object.values(o)) {

		if (typeof v == 'object') {
			n ^= Array.isArray(v) ? Array.hash(v) : Object.hash(v);
		}
		else if (typeof v == 'string') {
			n ^= v.hashCode();
		}
		else if (typeof v == 'number') {
			n ^= v;
		}
		else if (typeof v == 'boolean') {
			n ^= v ? 0x5c5c5c5c : 0xc5c5c5c5;
		}

	}

	return n >>> 0;
}

Object.normalize = function(o) {
	for (const [k, v] of Object.entries(o)) {
		if (typeof v == 'object') {
			if (Array.isArray(v)) {
				const a = v.filter(i => !!i);

				for (const i of a) 
					Object.normalize(i);

				o[k] = a;

			}
			else {
				if (Object.keys(v).length > 0)
					Object.normalize(v);
				else
					delete o[v];
			}

		}
	}
}

Object.filter = function(o, ...keys) {
	const r = {};
	for (const [k,v] of Object.entries(o))
		if (keys.includes(k))
			r[k] = v;
}

Object.merge = function(o, key='info') {

	const assign = (i) => {
		if (i[key]) {
			Object.assign(i, i[key]);
			delete i[key];
		}
	}

	if (Array.isArray(o)) {
		for (const i of o) 
			assign(i);
	}
	else {
		assign(o);
	}

	return o;
}

Object.isClass = function(obj) {
	// Check if obj has a constructor and prototype
	return obj && typeof obj === 'object' && !Array.isArray(obj) && obj.constructor !== Object;
}

Object.clone = function(o) {
	var newObj = (o instanceof Array) ? [] : {};
	for (let i in o) {
		if (o[i] && typeof o[i] == "object") {

			newObj[i] = ArrayBuffer.isView(o[i]) 
				? new o[i].constructor(o[i]) 
				: Object.clone(o[i]);

			
		} else { 
			newObj[i] = o[i]
		}

	} 
	
	return newObj;
}

Object.getGetters = function(i, Base) {

	let getters = {};
	let proto = Object.getPrototypeOf(i);

	while (proto && proto !== Object.prototype) {
		const descriptors = Object.getOwnPropertyDescriptors(proto);

		for (const [key, descriptor] of Object.entries(descriptors)) {
			if (typeof descriptor.get === 'function' && !(key in getters)) {
				getters[key] = descriptor.get; // Store the getter function
			}
		}

		// if (proto == Base) break;
		
		proto = Object.getPrototypeOf(proto); // Move up the prototype chain
	}

	return getters;
}

Object.getSetters = function(i) {

	let setters = {};
	let proto = Object.getPrototypeOf(i);

	while (proto && proto !== Object.prototype) {
		const descriptors = Object.getOwnPropertyDescriptors(proto);

		for (const [key, descriptor] of Object.entries(descriptors)) {
			if (typeof descriptor.set === 'function' && !(key in setters)) {
				setters[key] = descriptor.set; // Store the getter function
			}
		}
		
		proto = Object.getPrototypeOf(proto); // Move up the prototype chain
	}

	return setters;
}

Object.getProperties = function(i) {

	const setters = {}, getters = {};

	let proto = Object.getPrototypeOf(i);

	while (proto && proto !== Object.prototype) {
		Object.getOwnProperties(proto, setters, getters);
		proto = Object.getPrototypeOf(proto); // Move up the prototype chain
	}

	return { setters, getters };
}

Object.getOwnProperties = function(proto, setters={}, getters={}) {

	const descriptors = Object.getOwnPropertyDescriptors(proto);

	for (const [key, descriptor] of Object.entries(descriptors)) {
		if (typeof descriptor.get === 'function' && !(key in getters)) {
			getters[key] = descriptor.get; // Store the getter function
		}

		if (typeof descriptor.set === 'function' && !(key in setters)) {
			setters[key] = descriptor.set; // Store the getter function
		}
	}

	return { setters, getters };
}

Object.getGetter = function(i, name) {
	const setters = Object.getGetters(i);
	return setters[name];
}

Object.getSetter = function(i, name) {
	const setters = Object.getSetters(i);
	return setters[name];
}

Object.getProperty = function(i, name) {
	const { setters, getters } = Object.getProperties(i);
	return { setter: setters[name], getter: getters[name] };
}

Object.fromInstance = function(i, Base, o={}) {

	const getters = Object.getGetters(i, Base);

	let v, a;

	for (const [name, get] of Object.entries(getters)) {
		// if (ignore.includes(name))
		// 	continue;

		v = get.call(i);

		if (v != null) {
			if (Array.isArray(v)) 
				v = v.map(i => i instanceof Base ? i.save() : i);
			else if (typeof v == 'object' && v instanceof Base) 
				v = v.save();
		}

		o[name] = v;
	}
		
	return o;
}

Object.instanceFrom = function(i, o) {

	const setters = Object.getSetters(i);

	for (const [name, set] of Object.entries(setters))
		if (name in o)
			set.call(i, o[name]);

	return i;
}

Object.hashHex = function(o) {
	return Object.hash(o).toString(16);
}

Array.repeat = function(n, v=0) {
	return new Array(n).fill(0);
}

Array.prototype.last = function() {
	return this[this.length - 1];
}

Array.hash = function(a) {

	let n = 3326489;

	for (const v of a) {
		if (typeof v == 'object') {
			n ^= Array.isArray(v) ? Array.hash(v) : Object.hash(v);
		}
		else if (typeof v == 'string') {
			n ^= v.hashCode();
		}
		else if (typeof v == 'number') {
			n ^= v;
		}
		else if (typeof v == 'boolean') {
			n ^= v ? 0x5c5c5c5c : 0xc5c5c5c5;
		}
	}

	return n >>> 0;
}

Array.prototype.unique = function() {
	return this.filter((value, index, array) => array.indexOf(value) === index);
}

Array.prototype.uniqueId = function(key='id') {
	return Array.from(new Set(this.map(i => i[key])))
		.map(id => this.find(i => i[key] == id));
}

Array.prototype.rotate = function(n) {
	n = n % this.length;
	return this.slice(n, this.length).concat(this.slice(0, n));
}

Array.prototype.sum = function() {
	return this.reduce((a,b) => a+b, 0);
}

Array.prototype.avg = function() {
	const total = this.sum();
	return total / this.length;
}

Array.prototype.avgi = function() {
	return Math.floor(this.avg());
}


Array.prototype.max = function() {
	return Math.max.apply(null, this);
}
  
Array.prototype.min = function() {
	return Math.min.apply(null, this);
}

