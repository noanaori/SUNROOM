/* Deretan 5 kotak warna yang diambil dari cover album */
export default function PaletteStrip({
  palette = [],
  large = false,
  showLabel = true,
  className = '',
  selectedIndex = null,
  onSelectSwatch = null,
}) {
  const colors = Array.isArray(palette) && palette.length > 0
    ? palette
    : ['#1A2852', '#3B486B', '#68718A', '#8EA8C3', '#A39B98'];

  return (
    <div
      className={`palette ${large ? 'palette--large' : ''} ${className}`}
      role="group"
      aria-label="Album color palette"
    >
      {showLabel && (
        <div className="palette__label">
          <span>Palette</span>
          <span className="sr-only">: {colors.join(', ')}</span>
        </div>
      )}
      <div className="palette__row" aria-hidden={!onSelectSwatch}>
        {colors.map((hex, index) => {
          if (onSelectSwatch) {
            const isSelected = selectedIndex === index;
            return (
              <button
                key={`${hex}-${index}`}
                type="button"
                className={`swatch-button ${isSelected ? 'is-selected' : ''}`}
                style={{ backgroundColor: hex }}
                onClick={() => onSelectSwatch(hex, index)}
                aria-label={`Select color ${hex}`}
                aria-pressed={isSelected}
                title={hex}
              />
            );
          }

          return (
            <span
              key={`${hex}-${index}`}
              className="palette__swatch"
              style={{ backgroundColor: hex }}
              title={hex}
            />
          );
        })}
      </div>
    </div>
  );
}
