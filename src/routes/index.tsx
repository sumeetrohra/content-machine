import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { KanbanPage } = await import('@/pages/kanban/KanbanPage');
          return { Component: KanbanPage };
        },
      },
      {
        path: 'idea/:id',
        lazy: async () => {
          const { IdeaDetailPage } =
            await import('@/pages/kanban/IdeaDetailPage');
          return { Component: IdeaDetailPage };
        },
      },
      {
        path: 'admin/rss-feeds',
        lazy: async () => {
          const { RssFeedsPage } = await import('@/pages/admin/RssFeedsPage');
          return { Component: RssFeedsPage };
        },
      },
      {
        path: 'admin/persona',
        lazy: async () => {
          const { PersonaPage } = await import('@/pages/admin/PersonaPage');
          return { Component: PersonaPage };
        },
      },
    ],
  },
]);
