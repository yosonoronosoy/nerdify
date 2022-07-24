interface IUser {
  id: string;
  email: string;
  name?: string | undefined;
  image?: string | undefined;
}

export type User = IUser | null | undefined;
