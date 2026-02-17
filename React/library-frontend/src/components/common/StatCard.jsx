import { Card, CardContent, Typography } from "@mui/material";

function StatCard({ title, value, helperText, color = "text.primary" }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h4" color={color} sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        {helperText ? (
          <Typography variant="caption" color="text.secondary">
            {helperText}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default StatCard;
