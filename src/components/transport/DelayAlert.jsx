import Icon from '../common/Icon';

/** Prominent delay message: text, icon and colour together. */
export default function DelayAlert({ minutes, reason, suggestion, actions }) {
  return (
    <div className="card card--warn" role="alert">
      <div className="row row--top">
        <span className="card-icon card-icon--warn"><Icon name="alert" size={22} /></span>
        <div className="stack stack--sm grow">
          <h3 className="h3">{minutes}-minute delay</h3>
          <p><strong>Reason: </strong>{reason}</p>
          {suggestion && (
            <p className="notice notice--ai"><Icon name="sparkles" size={18} /><span>{suggestion}</span></p>
          )}
          {actions && <div className="btn-row">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
