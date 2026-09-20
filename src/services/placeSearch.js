/** Finds a known place mentioned in plain text (typed or spoken), e.g. "take me to the airport". */
import { PLACES } from '../data/places';

const ALIASES = PLACES.flatMap((p) => (p.aliases || []).map((a) => ({ alias: a, id: p.id })))
  .sort((a, b) => b.alias.length - a.alias.length);

export function findPlace(text = '') {
  const t = ` ${text.toLowerCase()} `;
  const hit = ALIASES.find(({ alias }) => t.includes(` ${alias}`) || t.includes(`${alias} `));
  return hit ? hit.id : null;
}
