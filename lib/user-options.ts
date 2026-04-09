import { useMemo } from 'react';

export type UserOptionSource = {
  id: string;
  name: string | null | undefined;
};

export const getUserOptions = (users: UserOptionSource[]) =>
  useMemo(
    () =>
      users
        .filter((user): user is UserOptionSource & { name: string } =>
          Boolean(user.name?.trim()),
        )
        .map((user) => ({
          id: user.id,
          value: user.name,
          label: user.name,
        })),
    [users],
  );
