export function serializeForClient<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export function serializeForClientAny(data: any) {
  return JSON.parse(JSON.stringify(data));
}
