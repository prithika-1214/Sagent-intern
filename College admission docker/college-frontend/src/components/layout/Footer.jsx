import { Box, Typography } from "@mui/material";

const Footer = () => (
  <Box component="footer" sx={{ py: 2, textAlign: "center", borderTop: 1, borderColor: "divider", mt: 4 }}>
    <Typography variant="caption" color="text.secondary">
      College Admissions Management System
    </Typography>
  </Box>
);

export default Footer;
