import { Link } from "react-router-dom"
import { Hammer } from "lucide-react"
import { PageContainer } from "@/components/layout/PageContainer"
import { Button } from "@/components/forms/Button"

interface PlaceholderPageProps {
  title: string
  note?: string
}

export function PlaceholderPage({ title, note }: PlaceholderPageProps) {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Hammer className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold text-textPrimary">{title}</h1>
        {note && <p className="max-w-md text-textSecondary">{note}</p>}
        <Link to="/">
          <Button variant="outline">Kthehu në ballinë</Button>
        </Link>
      </div>
    </PageContainer>
  )
}
