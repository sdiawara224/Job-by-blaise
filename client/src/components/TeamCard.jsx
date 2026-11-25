import { useState } from 'react';
import Icon from './Icon.jsx';
import { validTeamPhoto } from '../teamContent.js';

export default function TeamCard({ member }) {
  const [failedUrl, setFailedUrl] = useState(null);
  const hasPhoto = member.photoUrl && validTeamPhoto(member.photoUrl) && failedUrl !== member.photoUrl;
  return (
    <article className="team-card">
      <div className="team-card-photo">
        {hasPhoto ? <img src={member.photoUrl} alt={`Portrait de ${member.name}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(member.photoUrl)} /> : <div className="team-photo-placeholder"><Icon name="profile" size={56} /><span>Photo à venir</span></div>}
      </div>
      <div className="team-card-copy">
        <h2>{member.name}</h2>
        <p className="team-card-role">{member.role}</p>
        <p className="team-card-bio">{member.bio}</p>
      </div>
    </article>
  );
}
