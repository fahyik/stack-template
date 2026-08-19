import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { useArchiveItem } from "./hooks/use-archive-item";
import { useItemsList } from "./hooks/use-items-list";
import type { WireItem } from "./lib/items-api";

import { Spinner } from "@repo/ui/components/spinner";
import { Button } from "@repo/ui/components/ui/button";

/**
 * Example admin view: the staff-facing end of the `items` slice, and the
 * reference for wiring TanStack Table in this app. The DELETE endpoint it
 * calls is gated by `checkAdmin` on the server.
 */
export function ItemsListView() {
  const { data, isPending, error } = useItemsList();
  const archiveItem = useArchiveItem();

  const columns = useMemo<ColumnDef<WireItem>[]>(
    () => [
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: (ctx) => ctx.getValue() ?? "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: (ctx) =>
          new Date(ctx.getValue() as string).toLocaleDateString(undefined, {
            dateStyle: "medium",
          }),
      },
      {
        id: "status",
        header: "Status",
        cell: (ctx) => (ctx.row.original.archivedAt ? "Archived" : "Active"),
      },
      {
        id: "actions",
        header: "",
        cell: (ctx) =>
          ctx.row.original.archivedAt ? null : (
            <Button
              variant="ghost"
              size="sm"
              disabled={archiveItem.isPending}
              onClick={() =>
                archiveItem.mutate({ itemId: ctx.row.original.id })
              }
            >
              Archive
            </Button>
          ),
      },
    ],
    [archiveItem]
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPending) {
    return <Spinner />;
  }
  if (error) {
    return (
      <p className="text-destructive text-sm">
        Could not load items: {error.message}
      </p>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Items</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-border border-b">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-muted-foreground px-3 py-2 text-left font-medium"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-border/60 border-b">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.getRowModel().rows.length === 0 ? (
        <p className="text-muted-foreground py-6 text-sm">No items yet.</p>
      ) : null}
    </div>
  );
}
