import test from 'node:test';
import assert from 'node:assert';

import { getMetaFromFilename3 } from './track.js';

const cases = [
    {
        filename: 'Breathe (feat. Tolü Makay) [Yy-lrK5lVpQ].mp4',
        expected: {
            title: 'Breathe (feat. Tolü Makay)',
            artist: ''
        }
    },
    {
        filename: 'Black Coffee - Wish You Were Here feat. Msaki (Official Video) [Ultra Music] [17zOUL27cJk].mp4',
        expected: {
            title: 'Wish You Were Here',
            artist: 'Black Coffee feat. Msaki', 
        }
    },
    {
        filename: 'Cinco feat. Nancy Vieira [5BzSeox_5xc].mp4',
        expected: {
            title: 'Cinco feat. Nancy Vieira',
            artist: ''
        }
    },
    {
        filename: 'Crazy (Nôze Remix - Extended Club Version) - Ornette [sxxGE-ZSqps].mp4',
        expected: {
            title: 'Crazy (Nôze Remix - Extended Club Version)',
            artist: 'Ornette'
        }
    },
    {
        filename: 'Different Gear vs. Sia - Drink to get drunk (extended mix) [zci1P_BAADg].mp4',
        expected: {
            title: 'Drink to get drunk (extended mix)',
            artist: 'Different Gear vs. Sia'
        }
    },
    {
        filename: 'Funkerman ft. JW - Fallin In Love (Digital Mode & Layla Moore Remode) [8zCScW6PjfY].mp4',
        expected: {
            title: 'Fallin In Love (Digital Mode & Layla Moore Remode)',
            artist: 'Funkerman ft. JW'
        }
    },

    {
        filename: 'John Creamer & Stephane K - I Wish You Were Here (Lexicon Avenue Remix) [EAqxfrsQ6s8].mp4',
        expected: {
            title: 'I Wish You Were Here (Lexicon Avenue Remix)',
            artist: 'John Creamer & Stephane K'
        }
    },

    {
        filename: 'PAWSA & Adventures of Stevie V - Dirty Cash (Money Talks) [vP-Z0VEC0RA].mp4',
        expected: {
            title: 'Dirty Cash (Money Talks)',
            artist: 'PAWSA & Adventures of Stevie V'
        }
    },

    {
        filename: 'The Chemical Brothers - Do It Again (HÄWK & LEVEL UP (IT) VIP Edit) [YoywwolGEd0].mp4',
        expected: {
            title: 'Do It Again (HÄWK & LEVEL UP (IT) VIP Edit)',
            artist: 'The Chemical Brothers'
        }
    },

    {
        filename: 'KDA - Just Say feat. Tinashe (Official Audio) ｜ Ministry of Sound [xiaIs318Th8].mp4',
        expected: {
            title: 'Just Say',
            artist: 'KDA feat. Tinashe ｜ Ministry of Sound'
        }
    },

    // {
    //     filename: '',
    //     expected: {
    //         title: '',
    //         artist: ''
    //     }
    // },
    
];

test('Filename parse', () => {

    for (const { filename, expected } of cases) {

        const result = getMetaFromFilename3(filename);

        assert.deepStrictEqual(result, expected);
    }

});