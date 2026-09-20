import { useMemo, useState } from 'react';
import { VEHICLES, EXPLORER_FILTERS } from '../../data/vehicles';
import TransportServiceCard from '../../components/transport/TransportServiceCard';
import { EmptyState, Notice } from '../../components/common/ui';
import Button from '../../components/common/Button';
import Icon from '../../components/common/Icon';

/** Transportation Explorer: the whole 2100 ecosystem, filterable. */
export default function ServicesPanel() {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    let l = VEHICLES;
    if (filter !== 'all') l = l.filter((v) => v.family === filter);
    const t = q.trim().toLowerCase();
    if (t) l = l.filter((v) => `${v.name} ${v.category} ${v.bestFor || ''} ${v.purpose || ''}`.toLowerCase().includes(t));
    return l;
  }, [filter, q]);
  return (
    <div className="panel-body">
      
      <p className="lead" style={{ margin: '6px 0 16px' }}>Four service categories, twenty vehicles. You never need to know them all: NEXORA picks for you.</p>
      <div className="search-field" style={{ marginBottom: 12 }}>
        <Icon name="search" size={20} />
        <label htmlFor="explore-q" className="sr-only">Search services</label>
        <input id="explore-q" className="input search-field__control" placeholder="Search, e.g. wheelchair, metro, air taxi" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="scroller" role="group" aria-label="Filter services">
        {EXPLORER_FILTERS.map((f) => <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</button>)}
      </div>
      <p className="small muted" role="status" style={{ margin: '6px 0 12px' }}>{list.length} service{list.length === 1 ? '' : 's'}</p>
      {list.length ? (
        <div className="grid-3" style={{ marginTop: 12 }}>
          {list.map((v) => <TransportServiceCard key={v.id} vehicle={v} detailed />)}
        </div>
      ) : (
        <EmptyState icon="search" title="No services match" action={<Button onClick={() => { setQ(''); setFilter('all'); }}>Clear search and filters</Button>}>Try a different word or remove the filter.</EmptyState>
      )}
    </div>
  );
}
