// cat ~/countries.json | jq 'map({(.code): {name, flag}}) | add'

import { formatTags } from './format';
import countries from '@common/countries.json' with { type: 'json' };

export const regionInfo = countries;

export function formatLocationHtml(station) {
	const region = station.countrycode ? regionInfo[station.countrycode] : { flag: '<i class="fa-solid fa-flag"></i>', name: 'Not specified' };

	const state = `<i class="ml-2">${station.state || region.name}</i>`;
	const country = region.flag;

	return `<strong>${country}</strong>${state}`;
}

export function formatStationDescriptionHtml(station) {
    const region = station.countrycode ? regionInfo[station.countrycode] : { flag: '<i class="fa-solid fa-flag"></i>', name: 'Not specified' };

    const flag = `<span>${region.flag}</span>`;
    const tags = `<span class="min-w-0 flex-1 uppercase text-pulse-accent/60 tracking-wider font-bold truncate">${formatTags(station.tags || 'various')}</span>`;

    return `<span class="flex items-center gap-2">${flag}${tags}</span>`;
}
