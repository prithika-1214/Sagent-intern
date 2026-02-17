import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Grid, MenuItem, Stack, TextField } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { collectExtraFields } from "../../utils/entityMappers";

function buildFieldSchema(field) {
  if (field.type === "number") {
    const numberSchema = z.preprocess(
      (value) => {
        if (value === "" || value === undefined || value === null) {
          return undefined;
        }
        const converted = Number(value);
        return Number.isNaN(converted) ? value : converted;
      },
      z.number({ invalid_type_error: `${field.label || field.name} must be a number` })
    );

    return field.required ? numberSchema : numberSchema.optional();
  }

  const stringSchema = z.string().transform((value) => value.trim());
  if (field.required) {
    return stringSchema.min(1, `${field.label || field.name} is required`);
  }

  return stringSchema.optional();
}

function buildSchema(fields, allowJsonEditor) {
  const shape = {};

  fields.forEach((field) => {
    shape[field.name] = buildFieldSchema(field);
  });

  if (allowJsonEditor) {
    shape.advancedJson = z
      .string()
      .optional()
      .refine((value) => {
        if (!value || !value.trim()) {
          return true;
        }
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }, "Advanced JSON must be valid JSON");
  }

  return z.object(shape);
}

/**
 * @param {{
 * fields: Array<{ name: string, label: string, type?: string, required?: boolean, options?: Array<{label: string, value: string|number}> }>,
 * defaultValues?: Record<string, any>,
 * submitLabel?: string,
 * loading?: boolean,
 * onSubmit: (payload: Record<string, any>) => Promise<void> | void,
 * onCancel?: () => void,
 * allowJsonEditor?: boolean,
 * }} props
 */
function DynamicForm({
  fields,
  defaultValues = {},
  submitLabel = "Save",
  loading,
  onSubmit,
  onCancel,
  allowJsonEditor = true,
}) {
  const schema = useMemo(() => buildSchema(fields, allowJsonEditor), [fields, allowJsonEditor]);

  const initialValues = useMemo(() => {
    const values = {};
    fields.forEach((field) => {
      values[field.name] = defaultValues[field.name] ?? field.defaultValue ?? "";
    });

    if (allowJsonEditor) {
      const extras = collectExtraFields(
        defaultValues,
        fields.map((field) => field.name)
      );
      values.advancedJson = Object.keys(extras).length ? JSON.stringify(extras, null, 2) : "";
    }

    return values;
  }, [fields, defaultValues, allowJsonEditor]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const submitHandler = async (values) => {
    const payload = { ...defaultValues };
    fields.forEach((field) => {
      const value = values[field.name];
      if (value !== undefined) {
        payload[field.name] = value;
      }
    });

    if (allowJsonEditor && values.advancedJson?.trim()) {
      const advancedValues = JSON.parse(values.advancedJson);
      Object.assign(payload, advancedValues);
    }

    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submitHandler)}>
      <Grid container spacing={2}>
        {fields.map((field) => {
          const type = field.type || "text";
          const hasOptions = Array.isArray(field.options) && field.options.length > 0;
          return (
            <Grid item xs={12} sm={field.fullWidth ? 12 : 6} key={field.name}>
              <TextField
                label={field.label}
                type={type === "date" ? "date" : type === "number" ? "number" : "text"}
                select={hasOptions}
                fullWidth
                InputLabelProps={type === "date" ? { shrink: true } : undefined}
                error={Boolean(errors[field.name])}
                helperText={errors[field.name]?.message || field.helperText || " "}
                {...register(field.name)}
              >
                {hasOptions
                  ? field.options.map((option) => (
                      <MenuItem value={option.value} key={`${field.name}-${option.value}`}>
                        {option.label}
                      </MenuItem>
                    ))
                  : null}
              </TextField>
            </Grid>
          );
        })}

        {allowJsonEditor ? (
          <Grid item xs={12}>
            <TextField
              label="Advanced JSON (optional)"
              multiline
              minRows={5}
              fullWidth
              error={Boolean(errors.advancedJson)}
              helperText={errors.advancedJson?.message || "Use this to add unknown backend fields."}
              {...register("advancedJson")}
            />
          </Grid>
        ) : null}
      </Grid>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, justifyContent: "flex-end" }}>
        {onCancel ? (
          <Button onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="contained" disabled={loading}>
          {submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}

export default DynamicForm;
