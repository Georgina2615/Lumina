// Presenta las declaraciones obligatorias
export default function ClinicalConsentStatements({ acceptedIds, onToggle, statements }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xl text-primary">Declaraciones de la clienta</legend>
      <p className="text-sm text-muted">Lee cada declaración y marca únicamente después de resolver cualquier duda</p>
      {statements.map((statement) => (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-hover bg-background p-4 text-sm leading-relaxed text-primary transition hover:border-secondary/30" key={statement.id}>
          <input
            checked={acceptedIds.includes(statement.id)}
            className="mt-1 size-4 shrink-0 accent-primary"
            onChange={() => onToggle(statement.id)}
            type="checkbox"
          />
          <span>{statement.text}</span>
        </label>
      ))}
    </fieldset>
  );
}
