/* Gambar suasana langit bertabur bintang plus kilatan meteor bergerak */
const METEORS = [
  { id: 1, top: '6%', left: '66%', delay: '0s', duration: '8s', size: '185px' },
  { id: 2, top: '16%', left: '84%', delay: '2.6s', duration: '9.5s', size: '215px' },
  { id: 3, top: '4%', left: '42%', delay: '5.2s', duration: '8.5s', size: '170px' },
  { id: 4, top: '26%', left: '92%', delay: '8s', duration: '10s', size: '205px' },
  { id: 5, top: '12%', left: '54%', delay: '10.6s', duration: '9s', size: '190px' },
  { id: 6, top: '34%', left: '76%', delay: '13.4s', duration: '10.5s', size: '210px' },
  { id: 7, top: '22%', left: '38%', delay: '16s', duration: '9s', size: '175px' },
];

const STARS = [
  { id: 1, top: '10%', left: '14%', opacity: 0.45, size: 2.5 },
  { id: 2, top: '16%', left: '32%', opacity: 0.35, size: 2 },
  { id: 3, top: '7%', left: '58%', opacity: 0.5, size: 2.5 },
  { id: 4, top: '22%', left: '78%', opacity: 0.38, size: 2 },
  { id: 5, top: '30%', left: '19%', opacity: 0.34, size: 2.5 },
  { id: 6, top: '12%', left: '89%', opacity: 0.44, size: 2.5 },
  { id: 7, top: '38%', left: '64%', opacity: 0.32, size: 2 },
  { id: 8, top: '25%', left: '47%', opacity: 0.38, size: 2 },
];

export default function MeteorBackground() {
  return (
    <div className="meteor-sky" aria-hidden="true">
      <div className="sky-backdrop sky-backdrop--day" />
      <div className="sky-backdrop sky-backdrop--night" />
      <div className="sky-horizon-glow" />

      {STARS.map((star) => (
        <span
          key={star.id}
          className="meteor-sky__star"
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
        />
      ))}

      {METEORS.map((meteor) => (
        <span
          key={meteor.id}
          className="meteor-sky__streak"
          style={{
            top: meteor.top,
            left: meteor.left,
            width: meteor.size,
            animationDelay: meteor.delay,
            animationDuration: meteor.duration,
          }}
        />
      ))}
    </div>
  );
}
