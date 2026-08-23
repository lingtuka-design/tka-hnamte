import React from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/post/$slug')({
  component: PostSlugRedirectComponent,
});

function PostSlugRedirectComponent() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate({ to: '/post/read', search: { slug }, replace: true });
  }, [slug, navigate]);

  return (
    <div className="py-16 text-center text-gray-500">
      <p>Redirecting to article...</p>
    </div>
  );
}
