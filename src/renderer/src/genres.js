
import rock from './assets/genres/rock.svg';
import pop from './assets/genres/pop.svg';
import dance from './assets/genres/dance.svg';

// raw string
// import rockSvg from '../assets/genres/rock.svg?raw';
// {@html rockSvg}


export const GENRE_ICONS = {
  rock,
  pop,
  dance
};


// Dynamic
/* const icons = import.meta.glob('../assets/genres/*.svg', { eager: true });

function getGenreIcon(name) {
  return icons[`../assets/genres/${name}.svg`]?.default;
}

*/