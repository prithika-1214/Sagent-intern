import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export default function DataTable({
  title,
  columns,
  rows,
  loading = false,
  emptyMessage = "No data available.",
  getRowId = (row) => row.id,
  renderActions,
}) {
  return (
    <Paper elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
      {title ? (
        <Box px={2.5} py={2} borderBottom="1px solid #e4e8f0">
          <Typography variant="h6">{title}</Typography>
        </Box>
      ) : null}

      {loading ? (
        <Box py={6} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Box py={6} textAlign="center">
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align || "left"} sx={{ fontWeight: 700 }}>
                    {column.header}
                  </TableCell>
                ))}
                {renderActions ? <TableCell align="right">Actions</TableCell> : null}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={getRowId(row)} hover>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align || "left"}>
                      {column.render ? column.render(row) : row[column.key] ?? "-"}
                    </TableCell>
                  ))}
                  {renderActions ? <TableCell align="right">{renderActions(row)}</TableCell> : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
