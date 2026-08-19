/**
 * Utility type that recursively converts Date objects to ISO string representations.
 * This reflects how JavaScript Date objects are serialized when sent over HTTP as JSON.
 *
 * Handles Date, arrays and plain objects. Map, Set and functions pass
 * through unchanged — none of them should cross a JSON boundary anyway.
 *
 * @template T - The type to serialize
 */
export type Serialized<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Array<Serialized<U>>
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

/**
 * Generic type for API endpoints that defines the contract between client and server.
 *
 * @template TBody - Type for request body (use `never` if no body)
 * @template TQuery - Type for query parameters (use `never` if no query)
 * @template TParams - Type for URL path parameters (use `never` if no params)
 * @template TResponse - Type for response data (Date fields will be serialized to strings)
 */
export type ApiEndpoint<
  TBody = never,
  TQuery = never,
  TParams = never,
  TResponse = unknown,
> = {
  body: TBody;
  query: TQuery;
  params: TParams;
  response:
    | { success: true; data: Serialized<TResponse> }
    | { success: false; reason?: string };
};
