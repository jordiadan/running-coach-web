import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Brand from "@/components/Brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <header className="public-shell py-8">
        <Brand />
      </header>
      <main className="public-shell flex min-h-[65vh] flex-col items-start justify-center">
        <p className="font-display text-8xl text-primary">404</p>
        <h1 className="mt-4 font-display text-5xl">A little off course.</h1>
        <p className="mb-8 mt-5 max-w-md leading-7 text-muted-foreground">
          This page doesn't exist. Head back to Running Coach to find your way.
        </p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      </main>
    </div>
  );
}
