export type HomeTopic = {
  id: string;
  name: string;
  postCount: number;
};

export type HomeTopicsResponse = {
  topics: HomeTopic[];
  hasMore: boolean;
  source: "redis" | "database";
};
