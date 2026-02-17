import { Box, CircularProgress, Typography } from '@mui/material';

const Loading = ({ message = 'Loading...', fullHeight = false }) => (
  <Box
    sx={{
      minHeight: fullHeight ? '60vh' : '180px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1.5
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

export default Loading;