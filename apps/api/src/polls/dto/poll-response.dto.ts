export interface PollOptionResponse {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export interface PollResponse {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  county?: string | null;
  status: string;
  visibility: string;
  expiresAt: string;
  totalVotes: number;
  relatedPetitionIds: string[];
  options: PollOptionResponse[];
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
  };
}

export interface PollListResponse {
  id: string;
  slug: string;
  title: string;
  category: string;
  county?: string | null;
  status: string;
  totalVotes: number;
  expiresAt: string | Date;
}
