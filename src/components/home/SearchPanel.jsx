import { useId, useMemo, useState } from 'react';
import Icon from '../common/Icon';
import Button from '../common/Button';
import { PLACES, PLACE_BY_ID, PURPOSES, NEEDS } from '../../data/places';
import { findPlace } from '../../services/placeSearch';
import { listenOnce } from '../../services/speechService';
import { useApp } from '../../context/AppContext';
import { hhmmNow } from '../../utils/time';

/** Compact mode tucks the optional questions behind "More options". */
function Wrap({ compact, children }) {
  if (!compact) return children;
  return (
    <details className="nx-plan__opts">
      <summary><Icon name="sliders" size={18} />More options<Icon name="down" size={16} /></summary>
      {children}
    </details>
  );
}

/**
 * The main journey search. Asks four plain questions:
 * Where are you going? When? Why? What do you need?
 */
export default function SearchPanel({ initial, onPlan, onViewAll, compact = false }) {
  const { prefs, profile, setA11yOpen } = useApp();
  const [fromId, setFromId] = useState(initial?.fromId || 'here');
  const placeLabel = (id) => (id === 'here' ? 'Current location' : PLACE_BY_ID[id]?.label || '');
  const [fromText, setFromText] = useState(placeLabel(initial?.fromId || 'here'));
  const [fromFocused, setFromFocused] = useState(false);
  const [toText, setToText] = useState(initial?.toId ? PLACE_BY_ID[initial.toId]?.label || '' : '');
  const [toId, setToId] = useState(initial?.toId || null);
  const [whenMode, setWhenMode] = useState('now');
  const [time, setTime] = useState(hhmmNow(30).slice(0, 4) + '0');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [purpose, setPurpose] = useState(initial?.purpose || 'everyday');
  const [needs, setNeeds] = useState(initial?.needs || []);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(null);
  const [focused, setFocused] = useState(false);
  const toId$ = useId();

  const suggestions = useMemo(() => {
    const t = toText.trim().toLowerCase();
    const list = PLACES.filter((p) => p.id !== 'here' && p.id !== fromId);
    if (!t) return list.slice(1, 7);
    return list.filter((p) => p.label.toLowerCase().includes(t) || p.name.toLowerCase().includes(t) || p.aliases.some((a) => a.includes(t))).slice(0, 6);
  }, [toText, fromId]);

  const fromSuggestions = useMemo(() => {
    const t = fromText.trim().toLowerCase();
    if (!t || !fromFocused) return [];
    return PLACES.filter((p) => p.id !== toId && (
      placeLabel(p.id).toLowerCase().includes(t) || p.name.toLowerCase().includes(t) || p.aliases.some((a) => a.includes(t))
    )).slice(0, 6);
  }, [fromText, fromFocused, toId]);

  const chooseFrom = (p) => { setFromId(p.id); setFromText(placeLabel(p.id)); setError(''); setFromFocused(false); };

  const choose = (p) => { setToId(p.id); setToText(p.label); setError(''); setFocused(false); };

  const voice = async () => {
    setListening('listening');
    const res = await listenOnce({ lang: profile.language, fallback: 'Take me to Serenity General Hospital' });
    const id = findPlace(res.text);
    setListening(res.simulated ? 'simulated' : null);
    setToText(res.text);
    if (id) choose(PLACE_BY_ID[id]);
    else setError(`We heard “${res.text}” but could not match a place. Try saying a place name, or type it.`);
    setTimeout(() => setListening(null), 3500);
  };

  const toggleNeed =(id) => setNeeds((n) => (n.includes(id) ? n.filter((x) => x !== id) : [...n, id]));

  const submit = (e) => {
    e?.preventDefault();
    const id = toId || findPlace(toText);
    // Resolve a starting point that was typed but not picked from the list.
    const typedFrom = fromText.trim();
    const from = typedFrom && typedFrom !== placeLabel(fromId) ? findPlace(typedFrom) || fromId : fromId;
    if (!id) { setError('Choose where you are going. Type a place, pick a suggestion or tap a quick destination.'); document.getElementById(toId$)?.focus(); return; }
    if (id === from) { setError('Your destination is the same as your starting point. Choose a different place.'); return; }
    onPlan({ fromId: from, toId: id, whenMode, time: whenMode === 'now' ? null : time, date, purpose, needs });
  };

  const prefNeeds = [prefs.stepFree && 'stepFree', prefs.wheelchair && 'wheelchair', prefs.extraTime && 'extraTime'].filter(Boolean);

  return (
    <form className={compact ? 'nx-plan' : 'card search-card'} onSubmit={submit} noValidate aria-labelledby="search-title">
      <h2 className={compact ? 'sr-only' : 'h2'} id="search-title">Where are you going?</h2>

      <div className="search-od">
        <div className="field" style={{ position: 'relative' }}>
          <label className="field__label" htmlFor="from">From</label>
          <div className="search-field">
            <Icon name="locate" size={20} />
            <input
              id="from"
              className="input search-field__control"
              placeholder="Type a starting point"
              value={fromText}
              autoComplete="off"
              role="combobox"
              aria-expanded={fromSuggestions.length > 0}
              aria-controls="from-suggestions"
              onFocus={(e) => { setFromFocused(true); e.target.select(); }}
              onBlur={() => setTimeout(() => {
                setFromFocused(false);
                // Keep a typed starting point if it matches a known place, otherwise restore the last valid one.
                const typed = fromText.trim();
                const id = typed && typed !== placeLabel(fromId) ? findPlace(typed) : null;
                if (id && id !== toId) { setFromId(id); setFromText(placeLabel(id)); } else setFromText(placeLabel(fromId));
              }, 150)}
              onChange={(e) => setFromText(e.target.value)}
            />
          </div>
          {fromSuggestions.length > 0 && (
            <ul className="suggest" id="from-suggestions" role="listbox" aria-label="Suggested starting points">
              {fromSuggestions.map((p) => (
                <li key={p.id} role="option" aria-selected={fromId === p.id}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => chooseFrom(p)}>
                    <Icon name={p.id === 'here' ? 'locate' : p.icon} size={18} /><span><strong>{placeLabel(p.id)}</strong>{p.id !== 'here' && <small>{p.name}</small>}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="field" style={{ position: 'relative' }}>
          <label className="field__label" htmlFor={toId$}>To</label>
          <div className="search-field search-field--to">
            <Icon name="pin" size={20} />
            <input
              id={toId$}
              className="input search-field__control"
              placeholder="Where do you want to go?"
              value={toText}
              autoComplete="off"
              role="combobox"
              aria-expanded={focused && suggestions.length > 0}
              aria-controls="dest-suggestions"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'dest-error' : undefined}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 150)}
              onChange={(e) => { setToText(e.target.value); setToId(null); setError(''); }}
            />
            {prefs.voiceInput && (
              <button type="button" className={`icon-btn voice-btn ${listening === 'listening' ? 'is-listening' : ''}`} onClick={voice} aria-label="Say your destination">
                <Icon name="mic" size={22} />
              </button>
            )}
          </div>
          {focused && suggestions.length > 0 && (
            <ul className="suggest" id="dest-suggestions" role="listbox" aria-label="Suggested destinations">
              {suggestions.map((p) => (
                <li key={p.id} role="option" aria-selected={toId === p.id}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => choose(p)}>
                    <Icon name={p.icon} size={18} /><span><strong>{p.label}</strong><small>{p.name}{p.farKm ? `, ${p.farKm} km away` : ''}</small></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {listening === 'listening' && <p className="small muted" role="status">Listening… say a place like “the airport”.</p>}
          {listening === 'simulated' && <p className="tiny faint" role="status">Voice was simulated because this browser has no speech recognition.</p>}
          {error && <p className="field__error" id="dest-error" role="alert"><Icon name="alert" size={16} />{error}</p>}
        </div>
      </div>

      <fieldset className="search-group">
        <legend className="field__label">When do you need to travel?</legend>
        <div className="row row--wrap">
          <div className="seg" role="group" aria-label="Timing">
            {[['now', 'Leave now'], ...(compact ? [] : [['depart', 'Leave at']]), ['arrive', 'Arrive by']].map(([v, l]) => (
              <button key={v} type="button" aria-pressed={whenMode === v} onClick={() => setWhenMode(v)}>{l}</button>
            ))}
          </div>
          {whenMode !== 'now' && (
            <div className="row">
              <label className="sr-only" htmlFor="when-time">Time</label>
              <input id="when-time" type="time" className="input" style={{ width: 130 }} value={time} onChange={(e) => setTime(e.target.value)} />
              <label className="sr-only" htmlFor="when-date">Date</label>
              <input id="when-date" type="date" className="input adv" style={{ width: 170 }} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
        </div>
      </fieldset>

      <Wrap compact={compact}>
      <fieldset className="search-group">
        <legend className="field__label">Why are you travelling?</legend>
        <div className="scroller" role="group" aria-label="Travel purpose">
          {PURPOSES.map((p) => (
            <button key={p.id} type="button" className="chip" aria-pressed={purpose === p.id} onClick={() => setPurpose(p.id)}>
              <Icon name={p.icon} size={18} />{p.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="search-group">
        <legend className="field__label">What do you need?</legend>
        <div className="chips" role="group" aria-label="Travel needs">
          {NEEDS.map((n) => {
            const fromPrefs = prefNeeds.includes(n.id);
            return (
              <button key={n.id} type="button" className="chip" aria-pressed={needs.includes(n.id) || fromPrefs} onClick={() => toggleNeed(n.id)} title={n.hint} disabled={fromPrefs}>
                <Icon name={n.icon} size={18} />{n.label}{fromPrefs && <span className="sr-only"> (on in your accessibility settings)</span>}
              </button>
            );
          })}
        </div>
        {prefNeeds.length > 0 && <p className="tiny faint">Some needs are switched on from your accessibility settings.</p>}
      </fieldset>

      </Wrap>

      {compact ? (
        <>
          <div className="nx-plan__foot">
            <Button type="submit" variant="primary" size="lg" icon="sparkles">Plan my journey</Button>
          </div>
          <div className="nx-plan__prefs">
            {prefs.stepFree || prefs.wheelchair || prefs.lessWalking || prefs.extraTime ? (
              <>
                {prefs.stepFree || prefs.wheelchair ? <span className="ok"><Icon name="check" size={14} />Step-free</span> : null}
                {prefs.lessWalking ? <span className="ok"><Icon name="check" size={14} />Less walking</span> : null}
                {prefs.extraTime ? <span className="ok"><Icon name="check" size={14} />Extra boarding time</span> : null}
              </>
            ) : <span>Your accessibility preferences shape every route.</span>}
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setA11yOpen(true)}>Preferences</button>
          </div>
        </>
      ) : (
        <div className="btn-row">
          <Button type="submit" variant="primary" size="lg" icon="sparkles">Plan my journey</Button>
          <Button size="lg" onClick={onViewAll}>View all options</Button>
        </div>
      )}
    </form>
  );
}
