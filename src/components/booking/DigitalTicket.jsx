import QRCode from './QRCode';
import JourneyRibbon from '../transport/JourneyRibbon';
import Icon from '../common/Icon';
import { clock } from '../../utils/time';
import { money } from '../../utils/format';

export default function DigitalTicket({ ticketId, route, total }) {
  return (
    <article className="ticket" aria-label="Digital ticket">
      <div className="ticket__top">
        <div>
          <p className="tiny">NEXORA ticket</p>
          <h3 className="h3">{route.fromName} to {route.toShort}</h3>
          <p className="small">{clock(route.departTime)} to {clock(route.arriveTime)}, {route.transferCount} change{route.transferCount === 1 ? '' : 's'}</p>
        </div>
        <Icon name="ticket" size={26} />
      </div>
      <JourneyRibbon route={route} showNames={false} />
      <div className="ticket__code">
        <QRCode value={ticketId} />
        <div className="stack stack--sm">
          <p className="small"><strong>Scan or tap to board.</strong> Works offline.</p>
          <p className="tiny ticket__id">{ticketId}</p>
          <p className="small">Paid {money(total)}</p>
          <p className="tiny"><Icon name="bolt" size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> NFC tap boarding ready</p>
        </div>
      </div>
    </article>
  );
}
