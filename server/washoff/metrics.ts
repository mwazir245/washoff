export interface WashoffMetricCounterSnapshot {
  name: string;
  tags: Record<string, string>;
  value: number;
  updatedAt: string;
}

export interface WashoffMetrics {
  incrementCounter(
    name: string,
    tags?: Record<string, string | number | boolean | undefined>,
    value?: number,
  ): void;
  getCounters(): WashoffMetricCounterSnapshot[];
}

interface StoredCounter {
  name: string;
  tags: Record<string, string>;
  value: number;
  updatedAt: string;
}

const normalizeTags = (tags: Record<string, string | number | boolean | undefined> = {}) => {
  return Object.fromEntries(
    Object.entries(tags)
      .filter(([, value]) => value !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => [key, String(value)]),
  );
};

const buildCounterKey = (name: string, tags: Record<string, string>) => {
  const serializedTags = Object.entries(tags)
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
  return `${name}|${serializedTags}`;
};

export const createInMemoryWashoffMetrics = (): WashoffMetrics => {
  const counters = new Map<string, StoredCounter>();

  return {
    incrementCounter(name, tags = {}, value = 1) {
      const normalizedTags = normalizeTags(tags);
      const key = buildCounterKey(name, normalizedTags);
      const existing = counters.get(key);
      const updatedAt = new Date().toISOString();

      counters.set(key, {
        name,
        tags: normalizedTags,
        value: (existing?.value ?? 0) + value,
        updatedAt,
      });
    },

    getCounters() {
      return Array.from(counters.values()).sort((left, right) => left.name.localeCompare(right.name));
    },
  };
};
