import { Link } from "react-router-dom"
import { PageContainer } from "../components/layout/PageContainer"

export function NotFoundPage() {
  return (
    <PageContainer className="flex flex-col items-center justify-center py-24 text-center">
      <p className="font-serif text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Back to home
      </Link>
    </PageContainer>
  )
}
