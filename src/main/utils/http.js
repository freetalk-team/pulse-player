

export default class Http {

    static UserAgent = 'Mozilla/5.0 (compatible; PulsePlayer/1.0)';

    static async get(url, opt={}) {

        const res = await fetch(url, buildOtions(opt || {}));

        if (!res.ok) 
            throw new Error(`Failed: ${res.status}`);

        const contentType = res.headers.get('content-type') || '';
        if (contentType == 'application/json')
            return res.json();

        return res.text();
    }

}

function buildOtions(opt) {
    const headers = {
        'User-Agent': Http.UserAgent
    };

    const o = {};

    if (opt.timeout)
        o.signal = AbortSignal.timeout(opt.timeout);

    if (opt.headers)
        Object.assign(headers, opt.headers);

    if (opt.redirect)
        o.redirect = typeof opt.redirect == 'string' ? opt.redirect : 'follow';

    o.headers = headers;

    return o;
}