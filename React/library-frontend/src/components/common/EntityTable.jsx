import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import EmptyState from "./EmptyState";

/**
 * @param {{
 * rows: Array<Record<string, any>>,
 * columns: Array<{ key: string, label: string, render?: (row: Record<string, any>) => any }>,
 * getRowKey?: (row: Record<string, any>, index: number) => string | number,
 * actionsLabel?: string,
 * renderActions?: (row: Record<string, any>) => any,
 * emptyTitle?: string,
 * emptyDescription?: string,
 * }} props
 */
function EntityTable({
  rows,
  columns,
  getRowKey,
  actionsLabel = "Actions",
  renderActions,
  emptyTitle,
  emptyDescription,
}) {
  if (!rows?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} sx={{ fontWeight: 700 }}>
                {column.label}
              </TableCell>
            ))}
            {renderActions ? <TableCell sx={{ fontWeight: 700 }}>{actionsLabel}</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={getRowKey ? getRowKey(row, index) : index} hover>
              {columns.map((column) => (
                <TableCell key={column.key}>
                  {column.render ? column.render(row) : row[column.key] ?? "-"}
                </TableCell>
              ))}
              {renderActions ? <TableCell>{renderActions(row)}</TableCell> : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default EntityTable;
