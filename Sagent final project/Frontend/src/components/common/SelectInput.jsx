const SelectInput = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select',
  required = false,
  error,
  disabled = false
}) => (
  <label className="field-group">
    <span className="field-label">
      {label}
      {required ? <em>*</em> : null}
    </span>
    <select
      className={`field-input ${error ? 'has-error' : ''}`}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {(options || []).map((option, index) => (
        <option key={`${String(option?.value ?? '')}-${index}`} value={option?.value ?? ''}>
          {option.label}
        </option>
      ))}
    </select>
    {error ? <small className="field-error">{error}</small> : null}
  </label>
);

export default SelectInput;
