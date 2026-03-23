const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  min,
  max,
  step,
  disabled = false
}) => (
  <label className="field-group">
    <span className="field-label">
      {label}
      {required ? <em>*</em> : null}
    </span>
    <input
      className={`field-input ${error ? 'has-error' : ''}`}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
    />
    {error ? <small className="field-error">{error}</small> : null}
  </label>
);

export default FormInput;
