import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/r/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/cadastro",
      search: { ref: params.slug },
    });
  },
});
