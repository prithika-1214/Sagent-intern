import FormInput from '../common/FormInput';
import SelectInput from '../common/SelectInput';

const IMAGE_MAX_WIDTH = 1200;
const IMAGE_MAX_HEIGHT = 720;
const IMAGE_OUTPUT_QUALITY = 0.82;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image'));
    image.src = src;
  });

const resizeImageFile = async (file) => {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const scale = Math.min(1, IMAGE_MAX_WIDTH / image.width, IMAGE_MAX_HEIGHT / image.height);
  const targetWidth = Math.max(1, Math.round(image.width * scale));
  const targetHeight = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    return originalDataUrl;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/jpeg', IMAGE_OUTPUT_QUALITY);
};

const createSyntheticChangeEvent = (name, value) => ({
  target: { name, value }
});

const AdminEntityForm = ({ fields, values, errors, onChange, onSubmit, onCancel, loading, submitText }) => {
  const handleFileChange = async (event, field) => {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      input.setCustomValidity('Please choose an image file.');
      input.reportValidity();
      input.value = '';
      return;
    }

    input.setCustomValidity('');

    try {
      const imageUrl = await resizeImageFile(file);
      onChange(createSyntheticChangeEvent(field.name, imageUrl));
    } catch {
      input.setCustomValidity('Unable to process the selected image.');
      input.reportValidity();
    } finally {
      input.value = '';
    }
  };

  const renderHelperText = (field) =>
    field.helperText && !errors[field.name] ? <small className="field-help">{field.helperText}</small> : null;

  return (
    <form className="grid-form two-col" onSubmit={onSubmit}>
      {fields.map((field) => {
        if (field.type === 'hidden') {
          return <input key={field.name} type="hidden" name={field.name} value={values[field.name] || ''} readOnly />;
        }

        if (field.type === 'select') {
          return (
            <SelectInput
              key={field.name}
              label={field.label}
              name={field.name}
              value={values[field.name]}
              onChange={onChange}
              options={field.options || []}
              required={field.required}
              error={errors[field.name]}
              placeholder={field.placeholder}
            />
          );
        }

        if (field.type === 'textarea') {
          return (
            <label key={field.name} className="field-group">
              <span className="field-label">
                {field.label}
                {field.required ? <em>*</em> : null}
              </span>
              <textarea
                className={`field-input textarea ${errors[field.name] ? 'has-error' : ''}`}
                name={field.name}
                value={values[field.name] || ''}
                onChange={onChange}
                placeholder={field.placeholder}
                rows={4}
              />
              {errors[field.name] ? <small className="field-error">{errors[field.name]}</small> : null}
              {renderHelperText(field)}
            </label>
          );
        }

        if (field.type === 'file') {
          const previewUrl = values[field.name] || '';
          const inputId = `file-input-${field.name}`;

          return (
            <div key={field.name} className="field-group">
              <label className="field-label" htmlFor={inputId}>
                {field.label}
                {field.required ? <em>*</em> : null}
              </label>
              <input
                id={inputId}
                className={`field-input ${errors[field.name] ? 'has-error' : ''}`}
                name={field.name}
                type="file"
                accept={field.accept || 'image/*'}
                onChange={(event) => handleFileChange(event, field)}
              />
              {previewUrl ? (
                <div className="admin-image-preview">
                  <img src={previewUrl} alt={`${field.label} preview`} />
                  <button
                    type="button"
                    className="btn btn-small btn-outline"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onChange(createSyntheticChangeEvent(field.name, ''));
                    }}
                    disabled={loading}
                  >
                    Remove Poster
                  </button>
                </div>
              ) : null}
              {errors[field.name] ? <small className="field-error">{errors[field.name]}</small> : null}
              {renderHelperText(field)}
            </div>
          );
        }

        return (
          <div key={field.name}>
            <FormInput
              label={field.label}
              name={field.name}
              value={values[field.name]}
              onChange={onChange}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              required={field.required}
              error={errors[field.name]}
              min={field.min}
              max={field.max}
              step={field.step}
            />
            {renderHelperText(field)}
          </div>
        );
      })}
      <div className="form-actions full-width">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : submitText}
        </button>
      </div>
    </form>
  );
};

export default AdminEntityForm;
