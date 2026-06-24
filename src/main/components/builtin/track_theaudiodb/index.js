
import YAML from 'yaml';

import configRaw from './config.yml?raw';
import codeRaw from './code.js?raw';

const meta = YAML.parse(configRaw);

export default {
	...meta,
	code: codeRaw,
	builtin: true
}

