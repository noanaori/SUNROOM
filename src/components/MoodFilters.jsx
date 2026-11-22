import { MOODS } from '../constants/moods';

/* Deretan tombol filter biar user gampang nyaring lagu sesuai suasana hati */
export default function MoodFilters({ activeMood = 'all', onSelectMood }) {
  return (
    <nav className="mood-filters" aria-label="Mood filters">
      <span className="eyebrow" style={{ marginRight: '0.25rem' }}>Moods:</span>
      {MOODS.map((mood) => {
        const isActive = activeMood === mood.id;
        return (
          <button
            key={mood.id}
            type="button"
            className={`mood-chip ${isActive ? 'is-active' : ''}`}
            onClick={() => onSelectMood(mood)}
            aria-pressed={isActive}
          >
            {mood.label}
          </button>
        );
      })}
    </nav>
  );
}
