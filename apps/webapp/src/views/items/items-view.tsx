import { type FormEvent, useState } from "react";

import { signOut } from "../../lib/auth";
import { useCreateItem } from "./hooks/use-create-item";
import { useItemsList } from "./hooks/use-items-list";

import { Spinner } from "@repo/ui/components/spinner";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";

/**
 * Example view: the end of the `items` vertical slice. It exercises the whole
 * stack — session auth, apiFetch, the {success,data} contract, react-query
 * caching and invalidation. Delete it once you have a real resource.
 */
export function ItemsView() {
  const [name, setName] = useState("");
  const { data, isPending, error } = useItemsList();
  const createItem = useCreateItem();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    createItem.mutate({ name: trimmed }, { onSuccess: () => setName("") });
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Items</h1>
        <Button variant="ghost" onClick={() => void signOut()}>
          Sign out
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="mb-10 flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="item-name">New item</Label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Something to track"
          />
        </div>
        <Button type="submit" disabled={createItem.isPending || !name.trim()}>
          {createItem.isPending ? <Spinner /> : "Add"}
        </Button>
      </form>

      {isPending ? (
        <Spinner />
      ) : error ? (
        <p className="text-destructive text-sm">
          Could not load items: {error.message}
        </p>
      ) : data && data.items.length > 0 ? (
        <ul className="divide-border divide-y">
          {data.items.map((item) => (
            <li key={item.id} className="py-3">
              <span className="font-medium">{item.name}</span>
              {item.notes ? (
                <span className="text-muted-foreground ml-2 text-sm">
                  {item.notes}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          No items yet — add one above.
        </p>
      )}
    </main>
  );
}
