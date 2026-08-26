import { fromBackendTime, Period, toBackendTime } from '../utils/timeConversion';

export function TimeField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  const parsed = fromBackendTime(value);
  const update = (next: Partial<typeof parsed>) => {
    const merged = { ...parsed, ...next };
    onChange(toBackendTime(merged.hour, merged.minute, merged.period as Period));
  };
  return (
    <div>
      <label className="label">{label}</label>
      <div className="grid grid-cols-[1fr_1fr_90px] gap-2">
        <input className="input" inputMode="numeric" value={parsed.hour} onChange={(e) => update({ hour: e.target.value })} aria-label={`${label} hour`} />
        <select className="input" value={parsed.minute} onChange={(e) => update({ minute: e.target.value })} aria-label={`${label} minute`}>
          {['00', '15', '30', '45'].map((minute) => <option key={minute} value={minute}>{minute}</option>)}
        </select>
        <select className="input" value={parsed.period} onChange={(e) => update({ period: e.target.value as Period })} aria-label={`${label} AM or PM`}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
