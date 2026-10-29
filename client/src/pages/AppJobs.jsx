import JobsBoard from '../components/JobsBoard.jsx';

export default function AppJobs() {
  return (
    <div className="dash">
      <div className="page-title-row">
        <div>
          <h1>Offres d’emploi</h1>
          <p className="muted">Les offres notées pour ton profil — postule en un clic.</p>
        </div>
      </div>
      <JobsBoard />
    </div>
  );
}
